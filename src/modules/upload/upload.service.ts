import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface ImageUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  bytes: number;
}

interface TokenCache {
  accessToken: string;
  expiresAt: Date;
}

interface PolicyCache {
  policyId: string;
  timestamp: number;
}

class CloudreveClient {
  private tokenCache: TokenCache | null = null;
  private folderPolicyCache = new Map<string, PolicyCache>();
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      timeout: 60000,
    });
  }

  private getBaseUrl(): string {
    let url = process.env.CLOUDREVE_URL || '';
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api/v4')) url = `${url}/api/v4`;
    return url;
  }

  private async getAuthToken(): Promise<string> {
    if (this.tokenCache && new Date() < this.tokenCache.expiresAt) {
      return this.tokenCache.accessToken;
    }

    const baseUrl = this.getBaseUrl();
    const email = process.env.CLOUDREVE_EMAIL;
    const password = process.env.CLOUDREVE_PASSWORD;

    if (!baseUrl || !email || !password) {
      throw new Error('Cloudreve configuration missing (URL, email, or password).');
    }

    try {
      const response = await this.apiClient.post(`${baseUrl}/session/token`, {
        email,
        password,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || 'Unknown auth error');
      }

      const { access_token, access_expires } = response.data.data.token;

      const expiresAt = new Date(new Date(access_expires).getTime() - 5 * 60 * 1000);
      this.tokenCache = { accessToken: access_token, expiresAt };
      return access_token;
    } catch (error: any) {
      console.error(`Cloudreve authentication failed: ${error.message}`);
      throw new Error(`Cloudreve login failed: ${error.message}`);
    }
  }

  private async ensureFolderAndGetPolicy(token: string, folderUri: string): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await this.apiClient.post(
        `${baseUrl}/file/create`,
        {
          type: 'folder',
          uri: folderUri,
          err_on_conflict: false,
        },
        { headers }
      );
    } catch (err: any) {
      // Ignore if folder creation errors out (e.g. folder exists)
    }

    try {
      const dirResponse = await this.apiClient.get(`${baseUrl}/file`, {
        params: { uri: folderUri },
        headers,
      });

      if (dirResponse.data.code !== 0) {
        throw new Error(dirResponse.data.msg || 'Failed to fetch directory metadata');
      }

      const policyId = dirResponse.data.data?.storage_policy?.id;
      if (!policyId) {
        throw new Error('Directory does not have an assigned storage policy');
      }

      this.folderPolicyCache.set(folderUri, {
        policyId,
        timestamp: Date.now(),
      });
      return policyId;
    } catch (error: any) {
      throw new Error(`Failed to resolve policy ID for folder ${folderUri}: ${error.message}`);
    }
  }

  async uploadBuffer(buffer: Buffer, originalname: string): Promise<ImageUploadResult> {
    const token = await this.getAuthToken();
    const baseUrl = this.getBaseUrl();

    const ext = originalname.includes('.') ? originalname.split('.').pop() : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const folder = 'posts';
    const folderUri = `cloudreve://my/${folder}`;
    const fileUri = `cloudreve://my/${folder}/${filename}`;

    const policyId = await this.ensureFolderAndGetPolicy(token, folderUri);

    let session_id: string;
    let chunk_size: number;
    let upload_urls: string[] | undefined;

    try {
      const sessionResponse = await this.apiClient.put(
        `${baseUrl}/file/upload`,
        {
          uri: fileUri,
          size: buffer.length,
          policy_id: policyId,
          last_modified: Date.now(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (sessionResponse.data.code !== 0) {
        throw new Error(sessionResponse.data.msg || 'Unknown session creation error');
      }

      ({ session_id, chunk_size, upload_urls } = sessionResponse.data.data);
    } catch (error: any) {
      throw new Error(`Failed to create Cloudreve upload session: ${error.response?.data?.msg || error.message}`);
    }

    const chunkSize = chunk_size || 26214400; // 25MB
    const chunks: Buffer[] = [];
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      chunks.push(buffer.subarray(offset, offset + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let uploadUrl = upload_urls && upload_urls.length > i
        ? upload_urls[i]
        : `${baseUrl}/file/upload/${session_id}/${i}`;

      if (!uploadUrl.startsWith('http')) {
        uploadUrl = `${baseUrl.split('/api/v4')[0]}${uploadUrl}`;
      }

      try {
        const chunkResponse = await this.apiClient.post(uploadUrl, chunk, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': chunk.length,
            'Authorization': `Bearer ${token}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        if (chunkResponse.data && chunkResponse.data.code !== 0) {
          throw new Error(chunkResponse.data.msg);
        }
      } catch (error: any) {
        throw new Error(`Failed to upload chunk ${i}: ${error.response?.data?.msg || error.message}`);
      }
    }

    let secureUrl = '';
    try {
      const linkResponse = await this.apiClient.put(
        `${baseUrl}/file/source`,
        { uris: [fileUri] },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (linkResponse.data.code === 0 && linkResponse.data.data?.length > 0) {
        secureUrl = linkResponse.data.data[0].link;
      } else {
        secureUrl = fileUri;
      }
    } catch (error: any) {
      console.warn(`Failed to generate direct link: ${error.message}`);
      secureUrl = fileUri;
    }

    return {
      public_id: fileUri,
      url: secureUrl,
      secure_url: secureUrl,
      bytes: buffer.length,
    };
  }
}

@Injectable()
export class UploadService {
  private cloudreveClient = new CloudreveClient();

  async uploadFromBuffer(buffer: Buffer, originalname: string): Promise<ImageUploadResult> {
    try {
      return await this.cloudreveClient.uploadBuffer(buffer, originalname);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
