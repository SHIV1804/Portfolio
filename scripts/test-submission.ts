import { prisma } from "../shared/lib/prisma";
import { PostStatus } from "@prisma/client";

async function testSubmission() {
  console.log("Starting manual test submission...");

  try {
    // 1. Find a test user (or create one)
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found, creating a test user...");
      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      });
    }

    console.log(`Using user: \${user.name} (\${user.id})`);

    // 2. Create a PENDING post
    const title = "Manual Test Post " + Date.now();
    const content = "This is a manual test post content that meets the minimum length requirement of 50 characters.";
    const slug = title.toLowerCase().replace(/\s+/g, "-");

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        authorId: user.id,
        status: PostStatus.PENDING,
      },
    });

    console.log("Successfully created PENDING post:");
    console.log(JSON.stringify(post, null, 2));

    // 3. Verify it's in the DB
    const verifiedPost = await prisma.post.findUnique({
      where: { id: post.id },
    });

    if (verifiedPost && verifiedPost.status === PostStatus.PENDING) {
      console.log("VERIFICATION SUCCESS: Post found in DB with PENDING status.");
    } else {
      console.log("VERIFICATION FAILED: Post not found or status mismatch.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubmission();
