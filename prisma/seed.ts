import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing database records...');

  // Delete records in reverse dependency order
  await prisma.replyLike.deleteMany({});
  await prisma.reply.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleanup complete.');

  console.log('Generating password hash for Password@123...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  console.log('Seeding users...');
  const userSeeds = [
    { first_name: 'John', last_name: 'Doe', email: 'john@gmail.com' },
    { first_name: 'Jane', last_name: 'Smith', email: 'jane@gmail.com' },
    { first_name: 'Alex', last_name: 'Johnson', email: 'alex@gmail.com' },
    { first_name: 'Emily', last_name: 'Brown', email: 'emily@gmail.com' },
    { first_name: 'Michael', last_name: 'Davis', email: 'michael@gmail.com' },
    { first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@gmail.com' },
    { first_name: 'David', last_name: 'Miller', email: 'david@gmail.com' },
    { first_name: 'Jessica', last_name: 'Taylor', email: 'jessica@gmail.com' },
    { first_name: 'Daniel', last_name: 'Anderson', email: 'daniel@gmail.com' },
    { first_name: 'Olivia', last_name: 'Thomas', email: 'olivia@gmail.com' },
    { first_name: 'James', last_name: 'Jackson', email: 'james@gmail.com' },
    { first_name: 'Sophia', last_name: 'White', email: 'sophia@gmail.com' },
    { first_name: 'Robert', last_name: 'Harris', email: 'robert@gmail.com' },
    { first_name: 'Isabella', last_name: 'Martin', email: 'isabella@gmail.com' },
    { first_name: 'William', last_name: 'Thompson', email: 'william@gmail.com' },
    { first_name: 'Mia', last_name: 'Garcia', email: 'mia@gmail.com' },
    { first_name: 'Joseph', last_name: 'Martinez', email: 'joseph@gmail.com' },
    { first_name: 'Charlotte', last_name: 'Robinson', email: 'charlotte@gmail.com' },
    { first_name: 'Thomas', last_name: 'Clark', email: 'thomas@gmail.com' },
    { first_name: 'Amelia', last_name: 'Rodriguez', email: 'amelia@gmail.com' },
    { first_name: 'Charles', last_name: 'Lewis', email: 'charles@gmail.com' },
    { first_name: 'Harper', last_name: 'Lee', email: 'harper@gmail.com' },
    { first_name: 'Matthew', last_name: 'Walker', email: 'matthew@gmail.com' },
    { first_name: 'Evelyn', last_name: 'Hall', email: 'evelyn@gmail.com' },
    { first_name: 'Christopher', last_name: 'Allen', email: 'christopher@gmail.com' },
    { first_name: 'Abigail', last_name: 'Young', email: 'abigail@gmail.com' },
    { first_name: 'Andrew', last_name: 'King', email: 'andrew@gmail.com' },
    { first_name: 'Elizabeth', last_name: 'Wright', email: 'elizabeth@gmail.com' },
    { first_name: 'Joshua', last_name: 'Scott', email: 'joshua@gmail.com' },
    { first_name: 'Sofia', last_name: 'Green', email: 'sofia@gmail.com' },
    { first_name: 'Ryan', last_name: 'Adams', email: 'ryan@gmail.com' },
    { first_name: 'Grace', last_name: 'Baker', email: 'grace@gmail.com' },
    { first_name: 'Luke', last_name: 'Nelson', email: 'luke@gmail.com' },
    { first_name: 'Chloe', last_name: 'Carter', email: 'chloe@gmail.com' },
    { first_name: 'Nathan', last_name: 'Mitchell', email: 'nathan@gmail.com' },
  ];

  const createdUsers: any[] = [];
  for (const u of userSeeds) {
    const user = await prisma.user.create({
      data: {
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        password_hash: passwordHash,
      },
    });
    createdUsers.push(user);
  }
  console.log(`Successfully seeded ${createdUsers.length} users.`);

  // Map users by first_name for easy referencing
  const userMap = createdUsers.reduce((acc, user) => {
    acc[user.first_name] = user;
    return acc;
  }, {} as Record<string, any>);

  console.log('Seeding posts...');
  const postSeeds = [
    {
      author: 'John',
      content: 'Just finished building a new feature using React and NestJS. Feeling productive! 💻🚀',
      visibility: 'public',
    },
    {
      author: 'John',
      content: 'Enjoying a beautiful sunny afternoon at the park. ☀️🌳',
      visibility: 'public',
    },
    {
      author: 'Jane',
      content: 'Anyone has recommendations for good sci-fi books? Let me know in the comments! 📚',
      visibility: 'public',
    },
    {
      author: 'Alex',
      content: 'A great cup of coffee in the morning makes all the difference. ☕',
      visibility: 'public',
    },
    {
      author: 'Alex',
      content: 'Had an amazing weekend hiking in the mountains. Here is a quick photo of the view! ⛰️',
      visibility: 'public',
    },
    {
      author: 'Emily',
      content: 'Exploring the new design trends for 2026. Minimalist UI/UX is here to stay! 🎨',
      visibility: 'public',
    },
    {
      author: 'Michael',
      content: 'Pizza night with friends! What is your favorite topping? 🍕',
      visibility: 'public',
    },
    {
      author: 'Sarah',
      content: 'Starting a new journey learning machine learning. Excited but slightly overwhelmed! 🧠🤖',
      visibility: 'public',
    },
    {
      author: 'David',
      content: 'Stuck on a tricky bug for 3 hours, only to realize it was a typo in the config file. Typical developer life. 😅',
      visibility: 'public',
    },
    {
      author: 'Jessica',
      content: 'Just watched the new space documentary. The universe is mind-blowing. 🌌',
      visibility: 'public',
    },
    {
      author: 'Daniel',
      content: 'Sunday mornings are for pancakes and coding side projects. 🥞',
      visibility: 'public',
    },
    {
      author: 'Olivia',
      content: 'Adopted a new puppy today! Say hello to Milo. 🐶',
      visibility: 'public',
    },
    {
      author: 'James',
      content: 'Can anyone recommend a good workflow for Git branching on team projects? 🐙',
      visibility: 'public',
    },
    {
      author: 'Sophia',
      content: 'Morning runs are hard, but the feeling afterward is unmatched! 🏃‍♀️💨',
      visibility: 'public',
    },
    {
      author: 'Robert',
      content: 'Just watched the latest sci-fi movie. The plot was okay, but the visual effects were incredible!',
      visibility: 'public',
    },
    {
      author: 'Isabella',
      content: 'Baking sourdough bread today. Hoping it rises perfectly this time! 🍞',
      visibility: 'public',
    },
    {
      author: 'William',
      content: 'What is your favorite text editor / IDE for development? VS Code, WebStorm, or Neovim?',
      visibility: 'public',
    },
    {
      author: 'Mia',
      content: 'Listening to some lo-fi beats while designing dashboard wireframes. So relaxing. 🎧',
      visibility: 'public',
    },
    {
      author: 'Joseph',
      content: 'Working from a local cafe today. Change of scenery does wonders for productivity!',
      visibility: 'public',
    },
    {
      author: 'Charlotte',
      content: 'Just registered for the upcoming developer conference. Who else is going?',
      visibility: 'public',
    },
    {
      author: 'Thomas',
      content: 'A classic game of chess to wind down after a long day. Anyone up for a match online?',
      visibility: 'public',
    },
    {
      author: 'Amelia',
      content: 'Visiting a modern art museum. Some of these abstract sculptures are fascinating.',
      visibility: 'public',
    },
    {
      author: 'Harper',
      content: 'Finally set up my home office with a standing desk and ergonomic chair. My back is thanking me!',
      visibility: 'public',
    },
    {
      author: 'Matthew',
      content: 'Exploring SQL query optimization today. Database indexing makes a huge difference.',
      visibility: 'public',
    },
    {
      author: 'John',
      content: 'This is a private note just for me to test the private visibility setting.',
      visibility: 'private',
    },
  ];

  const createdPosts: any[] = [];
  for (const p of postSeeds) {
    const user = userMap[p.author];
    if (!user) continue;
    const post = await prisma.post.create({
      data: {
        user_id: user.id,
        content: p.content,
        visibility: p.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
      },
    });
    createdPosts.push({ ...post, authorName: p.author });
  }
  console.log(`Successfully seeded ${createdPosts.length} posts.`);

  console.log('Seeding comments...');
  const commentsToSeed = [
    // Comments on John's first post
    {
      postIndex: 0,
      commenter: 'Jane',
      content: 'Nice work John! Keep it up!',
    },
    {
      postIndex: 0,
      commenter: 'Alex',
      content: 'That is awesome, which feature did you build?',
    },
    // Comments on Jane's book recommendation post
    {
      postIndex: 2,
      commenter: 'Emily',
      content: 'You should read "Project Hail Mary" by Andy Weir. It is fantastic!',
    },
    {
      postIndex: 2,
      commenter: 'John',
      content: 'I highly recommend "Dune" if you haven\'t read it yet.',
    },
    {
      postIndex: 2,
      commenter: 'Daniel',
      content: 'The Foundation series by Isaac Asimov is a classic!',
    },
    // Comments on Alex's coffee post
    {
      postIndex: 3,
      commenter: 'Michael',
      content: 'Totally agree! What blend are you drinking?',
    },
    {
      postIndex: 3,
      commenter: 'Sarah',
      content: 'Need that coffee today, running on 4 hours of sleep.',
    },
    // Comments on Michael's pizza post
    {
      postIndex: 6,
      commenter: 'David',
      content: 'Pepperoni and jalapeños all the way! 🍕',
    },
    {
      postIndex: 6,
      commenter: 'Olivia',
      content: 'Mushrooms and truffle oil for me.',
    },
    // Comments on David's bug post
    {
      postIndex: 8,
      commenter: 'John',
      content: 'Happens to the best of us! Glad you solved it.',
    },
    {
      postIndex: 8,
      commenter: 'Jane',
      content: 'The classic typo. Classic!',
    },
    // Comments on Olivia's puppy post
    {
      postIndex: 11,
      commenter: 'Jessica',
      content: 'Omg so cute! 😍 What breed is he?',
    },
    {
      postIndex: 11,
      commenter: 'Alex',
      content: 'Welcome home, Milo!',
    },
    // Comments on James' Git branch post
    {
      postIndex: 12,
      commenter: 'Robert',
      content: 'GitHub Flow is simple and effective for small teams.',
    },
    {
      postIndex: 12,
      commenter: 'William',
      content: 'We use Gitlab Flow, which works great for our releases.',
    },
    // Comments on William's editor post
    {
      postIndex: 16,
      commenter: 'Mia',
      content: 'VS Code with custom extensions has everything I need.',
    },
    {
      postIndex: 16,
      commenter: 'Thomas',
      content: 'Neovim all the way! Once you learn the keybinds, there is no going back.',
    },
    // Comments on Charlotte's conference post
    {
      postIndex: 19,
      commenter: 'Amelia',
      content: 'I will be there! Let\'s meet up for coffee.',
    },
    {
      postIndex: 19,
      commenter: 'Harper',
      content: 'Wish I could make it, but I have a launch that week.',
    },
  ];

  const createdComments: any[] = [];
  for (const c of commentsToSeed) {
    const post = createdPosts[c.postIndex];
    const commenterUser = userMap[c.commenter];
    if (!post || !commenterUser) continue;

    const comment = await prisma.comment.create({
      data: {
        post_id: post.id,
        user_id: commenterUser.id,
        content: c.content,
      },
    });
    createdComments.push({ ...comment, commenterName: c.commenter });
  }
  console.log(`Successfully seeded ${createdComments.length} comments.`);

  console.log('Seeding replies to comments...');
  const repliesToSeed = [
    // John replies to Alex on post 0
    {
      commentIndex: 1, // Alex's comment
      replier: 'John',
      content: 'I built the real-time notification engine using WebSockets!',
    },
    // Jane replies to Emily on post 2
    {
      commentIndex: 2, // Emily's comment
      replier: 'Jane',
      content: 'Oh, I loved The Martian by Andy Weir, so I will definitely pick up Project Hail Mary! Thanks!',
    },
    // Olivia replies to Jessica on post 11
    {
      commentIndex: 11, // Jessica's comment
      replier: 'Olivia',
      content: 'He is a Golden Retriever puppy! 🦮',
    },
    // James replies to Robert on post 12
    {
      commentIndex: 13, // Robert's comment
      replier: 'James',
      content: 'Thanks, Robert! I will look into GitHub Flow details.',
    },
  ];

  const createdReplies: any[] = [];
  for (const r of repliesToSeed) {
    const comment = createdComments[r.commentIndex];
    const replierUser = userMap[r.replier];
    if (!comment || !replierUser) continue;

    const reply = await prisma.reply.create({
      data: {
        comment_id: comment.id,
        user_id: replierUser.id,
        content: r.content,
      },
    });
    createdReplies.push(reply);
  }
  console.log(`Successfully seeded ${createdReplies.length} replies.`);

  console.log('Seeding post likes...');
  const postLikesToSeed = [
    { postIndex: 0, liker: 'Jane' },
    { postIndex: 0, liker: 'Alex' },
    { postIndex: 0, liker: 'Emily' },
    { postIndex: 0, liker: 'Sophia' },
    { postIndex: 0, liker: 'Mia' },
    { postIndex: 2, liker: 'John' },
    { postIndex: 2, liker: 'Sarah' },
    { postIndex: 2, liker: 'Isabella' },
    { postIndex: 3, liker: 'Jane' },
    { postIndex: 3, liker: 'Michael' },
    { postIndex: 4, liker: 'Emily' },
    { postIndex: 4, liker: 'David' },
    { postIndex: 5, liker: 'Daniel' },
    { postIndex: 6, liker: 'John' },
    { postIndex: 6, liker: 'Jane' },
    { postIndex: 6, liker: 'Olivia' },
    { postIndex: 8, liker: 'Alex' },
    { postIndex: 8, liker: 'Sarah' },
    { postIndex: 11, liker: 'Jane' },
    { postIndex: 11, liker: 'Jessica' },
    { postIndex: 11, liker: 'Alex' },
    { postIndex: 12, liker: 'Robert' },
    { postIndex: 12, liker: 'William' },
    { postIndex: 13, liker: 'Thomas' },
    { postIndex: 13, liker: 'Amelia' },
    { postIndex: 16, liker: 'Harper' },
    { postIndex: 16, liker: 'Matthew' },
    { postIndex: 19, liker: 'Grace' },
    { postIndex: 19, liker: 'Luke' },
  ];

  let postLikesCount = 0;
  for (const pl of postLikesToSeed) {
    const post = createdPosts[pl.postIndex];
    const likerUser = userMap[pl.liker];
    if (!post || !likerUser) continue;

    await prisma.postLike.create({
      data: {
        post_id: post.id,
        user_id: likerUser.id,
      },
    });
    postLikesCount++;
  }
  console.log(`Successfully seeded ${postLikesCount} post likes.`);

  console.log('Seeding comment likes...');
  const commentLikesToSeed = [
    { commentIndex: 0, liker: 'John' },
    { commentIndex: 2, liker: 'Jane' },
    { commentIndex: 11, liker: 'Olivia' },
    { commentIndex: 13, liker: 'James' },
  ];

  let commentLikesCount = 0;
  for (const cl of commentLikesToSeed) {
    const comment = createdComments[cl.commentIndex];
    const likerUser = userMap[cl.liker];
    if (!comment || !likerUser) continue;

    await prisma.commentLike.create({
      data: {
        comment_id: comment.id,
        user_id: likerUser.id,
      },
    });
    commentLikesCount++;
  }
  console.log(`Successfully seeded ${commentLikesCount} comment likes.`);

  console.log('Syncing denormalized counts...');
  const posts = await prisma.post.findMany({
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  for (const post of posts) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likes_count: post._count.likes,
        comments_count: post._count.comments,
      },
    });
  }

  const comments = await prisma.comment.findMany({
    include: {
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  for (const comment of comments) {
    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        likes_count: comment._count.likes,
        replies_count: comment._count.replies,
      },
    });
  }

  const replies = await prisma.reply.findMany({
    include: {
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  for (const reply of replies) {
    await prisma.reply.update({
      where: { id: reply.id },
      data: {
        likes_count: reply._count.likes,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
