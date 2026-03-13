import { Octokit } from "@octokit/rest";

/**
 * @file github-storage.ts
 * @description Final Version of Aether SaaS Storage Service.
 * Implements Role-Level pathing, SHA-based updates, and Multi-format support.
 */

const GITHUB_TOKEN: string = process.env.GITHUB_TOKEN || "";
const REPO_DETAILS: string = process.env.NEXT_PUBLIC_GITHUB_REPO || "";

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export interface AetherPushParams {
  fileName: string;
  content: string;
  userRole: "student" | "teacher" | "business" | "general" | "guest";
  studentLevel?: "foundational" | "intermediate" | "research";
  userId: string;
  sessionID: string;
  folder: "notes" | "assets" | "pdf-exports" | "metadata";
  isBase64?: boolean;
}

/**
 * Handles professional GitHub synchronization for Aether data.
 */
export async function pushToAetherStorage(params: AetherPushParams): Promise<{ success: boolean; url?: string; error?: string }> {
  // 1. Repo Validation
  const [owner, repo] = REPO_DETAILS.split("/");
  if (!owner || !repo || !GITHUB_TOKEN) {
    return { success: false, error: "GitHub environment variables are missing." };
  }

  // 2. Standardized Path Logic (The Aether Way)
  // Format: storage/[role]/[level]/[userId]/[sessionId]/[folder]/[fileName]
  const roleSection = params.userRole;
  const levelSection = params.studentLevel || "general-level";
  
  const path: string = `storage/${roleSection}/${levelSection}/${params.userId}/${params.sessionID}/${params.folder}/${params.fileName}`;

  try {
    let sha: string | undefined = undefined;
    
 // 3. Check for existing file to handle Updates vs Creation
    try {
      const response = await octokit.repos.getContent({ owner, repo, path });

      if (!Array.isArray(response.data) && 'sha' in response.data) {
        sha = response.data.sha;
      }
    } catch {
      // 404 is valid for first-time sync (file does not exist yet)
      // We don't need 'error' here, so it's safer to omit it.
    }

    // 4. Content Encoding
    const encodedContent: string = params.isBase64 
      ? params.content 
      : Buffer.from(params.content, "utf-8").toString("base64");

    // 5. GitHub API Execution
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Aether-Core-Sync [${params.userRole.toUpperCase()}]: Session ${params.sessionID}`,
      content: encodedContent,
      sha,
      // Metadata in the commit body (optional but professional)
      committer: {
        name: "Aether AI Engine",
        email: "engine@aether-saas.local",
      },
    });

    return { 
      success: true, 
      url: `https://github.com/${owner}/${repo}/blob/main/${path}`
    };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal GitHub API failure.";
    console.error("Critical Storage Error:", message);
    return { success: false, error: message };
  }
}