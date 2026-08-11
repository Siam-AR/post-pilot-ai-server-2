import "dotenv/config";

const API_BASE =
  process.env.TEST_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/v1";

type Result = { success: boolean; message: string; data: any } | any;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
) {
  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const opts: any = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  let resBody: any = null;
  let ok = false;
  let status = 0;
  try {
    const resp = await fetch(url, opts);
    status = resp.status;
    const text = await resp.text();
    try {
      resBody = text ? JSON.parse(text) : null;
    } catch (e) {
      resBody = text;
    }
    ok = resp.ok;
  } catch (err) {
    return { ok: false, status: 0, body: null, error: String(err) };
  }
  return { ok, status, body: resBody };
}

function envelopeValid(body: any) {
  if (!body || typeof body !== "object") return false;
  return (
    Object.prototype.hasOwnProperty.call(body, "success") &&
    Object.prototype.hasOwnProperty.call(body, "message") &&
    Object.prototype.hasOwnProperty.call(body, "data")
  );
}

function logPass(tag: string, msg: string, status?: number, body?: any) {
  console.log(
    `\x1b[32m[PASS]\x1b[0m ${tag} - ${msg}${status ? ` (status ${status})` : ""}`,
  );
  if (body !== undefined) console.log("  Response:", JSON.stringify(body));
}
function logFail(tag: string, msg: string, status?: number, body?: any) {
  console.log(
    `\x1b[31m[FAIL]\x1b[0m ${tag} - ${msg}${status ? ` (status ${status})` : ""}`,
  );
  if (body !== undefined) console.log("  Response:", JSON.stringify(body));
}

(async () => {
  console.log("Starting API smoke tests against", API_BASE);
  const summary: { pass: number; fail: number; errors: string[] } = {
    pass: 0,
    fail: 0,
    errors: [],
  };

  // 1. HEALTH (/healthz preferred)
  const healthPaths = ["/healthz", "/health"];
  let healthOk = false;
  for (const p of healthPaths) {
    const r = await request("GET", p);
    if (r.ok && r.status === 200) {
      // prefer envelope success:true, but accept non-envelope /health
      if (envelopeValid(r.body)) {
        if (r.body.success === true) {
          logPass("[HEALTH]", `GET ${p}`, r.status, r.body);
          summary.pass++;
          healthOk = true;
          break;
        } else {
          logFail(
            "[HEALTH]",
            `GET ${p} responded but success!==true`,
            r.status,
            r.body,
          );
          summary.fail++;
        }
      } else if (r.body && (r.body.status === "ok" || r.body === "ok")) {
        logPass("[HEALTH]", `GET ${p} (non-envelope)`, r.status, r.body);
        summary.pass++;
        healthOk = true;
        break;
      } else {
        logFail(
          "[HEALTH]",
          `GET ${p} returned 200 but unexpected body`,
          r.status,
          r.body,
        );
        summary.fail++;
      }
    } else {
      // not ok, try next
    }
  }
  if (!healthOk) {
    summary.errors.push("HEALTH check failed");
  }

  // small delay
  await sleep(300);

  // 2. AUTH REGISTER
  const ts = Date.now();
  const testEmail = `testuser_${ts}@example.com`;
  const testPassword = "Password123!";
  const reg = await request("POST", "/auth/register", {
    name: "Test User",
    email: testEmail,
    password: testPassword,
  });
  if (
    reg.ok &&
    (reg.status === 201 || reg.status === 200) &&
    envelopeValid(reg.body)
  ) {
    // ensure password not returned
    const pdata = reg.body.data;
    if (
      pdata &&
      typeof pdata === "object" &&
      Object.values(pdata).some((v) => v === testPassword)
    ) {
      logFail(
        "[AUTH - REGISTER]",
        "Password returned in response body",
        reg.status,
        reg.body,
      );
      summary.fail++;
    } else {
      logPass(
        "[AUTH - REGISTER]",
        `Registered ${testEmail}`,
        reg.status,
        reg.body,
      );
      summary.pass++;
    }
  } else {
    logFail("[AUTH - REGISTER]", "Register failed", reg.status, reg.body);
    summary.fail++;
    summary.errors.push("REGISTER failed");
  }

  await sleep(200);

  // 3. AUTH LOGIN
  const login = await request("POST", "/auth/login", {
    email: testEmail,
    password: testPassword,
  });
  let token: string | null = null;
  if (login.ok && login.status === 200 && envelopeValid(login.body)) {
    token = login.body.data?.token || null;
    if (!token) {
      logFail(
        "[AUTH - LOGIN]",
        "No token in response",
        login.status,
        login.body,
      );
      summary.fail++;
    } else {
      logPass("[AUTH - LOGIN]", "Login returned token", login.status, {
        token: token.slice(0, 8) + "...",
      });
      summary.pass++;
    }
  } else {
    logFail("[AUTH - LOGIN]", "Login failed", login.status, login.body);
    summary.fail++;
    summary.errors.push("LOGIN failed");
  }

  await sleep(200);

  // 4. AUTH - PROTECTED CHECK
  const meWith = await request(
    "GET",
    "/auth/me",
    undefined,
    token || undefined,
  );
  if (meWith.ok && meWith.status === 200 && envelopeValid(meWith.body)) {
    logPass("[AUTH - ME]", "Authorized access OK", meWith.status, meWith.body);
    summary.pass++;
  } else {
    logFail(
      "[AUTH - ME]",
      "Authorized check failed",
      meWith.status,
      meWith.body,
    );
    summary.fail++;
  }

  const meWithout = await request("GET", "/auth/me");
  if (
    meWithout.status === 401 ||
    (envelopeValid(meWithout.body) && meWithout.body.success === false)
  ) {
    logPass(
      "[AUTH - ME]",
      "Unauthorized check (no token) returned 401",
      meWithout.status,
      meWithout.body,
    );
    summary.pass++;
  } else {
    logFail(
      "[AUTH - ME]",
      "Unauthorized check did not return 401",
      meWithout.status,
      meWithout.body,
    );
    summary.fail++;
  }

  await sleep(200);

  // 5. CATEGORIES CRUD
  let categoryId: string | null = null;
  const createCat = await request(
    "POST",
    "/categories",
    {
      name: `Tech & AI ${ts}`,
      slug: `tech-ai-${ts}`,
      description: "AI category",
    },
    token || undefined,
  );
  if (
    createCat.ok &&
    (createCat.status === 201 || createCat.status === 200) &&
    envelopeValid(createCat.body)
  ) {
    categoryId = createCat.body.data?.id || createCat.body.data?.ID || null;
    if (!categoryId) {
      logFail(
        "[CATEGORIES]",
        "Create did not return id",
        createCat.status,
        createCat.body,
      );
      summary.fail++;
    } else {
      logPass(
        "[CATEGORIES]",
        `Created category ${categoryId}`,
        createCat.status,
        createCat.body,
      );
      summary.pass++;
    }
  } else {
    logFail(
      "[CATEGORIES]",
      "Create category failed",
      createCat.status,
      createCat.body,
    );
    summary.fail++;
  }

  const listCats = await request("GET", "/categories");
  if (listCats.ok && listCats.status === 200 && envelopeValid(listCats.body)) {
    const found =
      Array.isArray(listCats.body.data) &&
      listCats.body.data.find(
        (c: any) => c.id === categoryId || c.slug === `tech-ai-${ts}`,
      );
    if (found) {
      logPass(
        "[CATEGORIES]",
        "List contains created category",
        listCats.status,
        found,
      );
      summary.pass++;
    } else {
      logFail(
        "[CATEGORIES]",
        "Created category not found in list",
        listCats.status,
        listCats.body,
      );
      summary.fail++;
    }
  } else {
    logFail(
      "[CATEGORIES]",
      "List categories failed",
      listCats.status,
      listCats.body,
    );
    summary.fail++;
  }

  const getCat = await request("GET", `/categories/${categoryId}`);
  if (getCat.ok && getCat.status === 200 && envelopeValid(getCat.body)) {
    logPass("[CATEGORIES]", "Get category OK", getCat.status, getCat.body);
    summary.pass++;
  } else {
    logFail("[CATEGORIES]", "Get category failed", getCat.status, getCat.body);
    summary.fail++;
  }

  const patchCat = await request(
    "PATCH",
    `/categories/${categoryId}`,
    { description: "Updated description" },
    token || undefined,
  );
  if (patchCat.ok && patchCat.status === 200 && envelopeValid(patchCat.body)) {
    logPass(
      "[CATEGORIES]",
      "Patch category OK",
      patchCat.status,
      patchCat.body,
    );
    summary.pass++;
  } else {
    logFail(
      "[CATEGORIES]",
      "Patch category failed",
      patchCat.status,
      patchCat.body,
    );
    summary.fail++;
  }

  await sleep(200);

  // 6. IDEAS CRUD
  let ideaId: string | null = null;
  const createIdea = await request(
    "POST",
    "/ideas",
    {
      title: "Test Idea",
      shortDescription: "Short",
      detailedDescription: "Detailed",
      categoryId,
      estimatedBudget: 100.0,
    },
    token || undefined,
  );
  if (
    createIdea.ok &&
    (createIdea.status === 201 || createIdea.status === 200) &&
    envelopeValid(createIdea.body)
  ) {
    ideaId = createIdea.body.data?.id || null;
    logPass("[IDEAS]", "Idea created", createIdea.status, createIdea.body);
    summary.pass++;
  } else {
    logFail(
      "[IDEAS]",
      "Create idea failed",
      createIdea.status,
      createIdea.body,
    );
    summary.fail++;
  }

  const listIdeas = await request("GET", "/ideas");
  if (
    listIdeas.ok &&
    listIdeas.status === 200 &&
    envelopeValid(listIdeas.body)
  ) {
    const found =
      Array.isArray(listIdeas.body.data) &&
      listIdeas.body.data.find((i: any) => i.id === ideaId);
    if (found && found.user && found.category) {
      logPass(
        "[IDEAS]",
        "Ideas list includes relations",
        listIdeas.status,
        found,
      );
      summary.pass++;
    } else {
      logFail(
        "[IDEAS]",
        "Ideas list missing relations or created idea",
        listIdeas.status,
        listIdeas.body,
      );
      summary.fail++;
    }
  } else {
    logFail("[IDEAS]", "List ideas failed", listIdeas.status, listIdeas.body);
    summary.fail++;
  }

  await sleep(200);

  // 7. POSTS CRUD & SOFT DELETE
  let postId: string | null = null;
  const createPost = await request(
    "POST",
    "/posts",
    {
      title: "AI Post",
      generatedContent: "Hello world",
      platform: "LinkedIn",
      tone: "Professional",
      length: "Short",
    },
    token || undefined,
  );
  if (
    createPost.ok &&
    (createPost.status === 201 || createPost.status === 200) &&
    envelopeValid(createPost.body)
  ) {
    postId = createPost.body.data?.id || null;
    logPass("[POSTS]", "Post created", createPost.status, createPost.body);
    summary.pass++;
  } else {
    logFail(
      "[POSTS]",
      "Create post failed",
      createPost.status,
      createPost.body,
    );
    summary.fail++;
  }

  const myPosts = await request(
    "GET",
    "/posts/my",
    undefined,
    token || undefined,
  );
  if (myPosts.ok && myPosts.status === 200 && envelopeValid(myPosts.body)) {
    const found = Array.isArray(myPosts.body.data)
      ? myPosts.body.data.find((p: any) => p.id === postId)
      : null;
    if (found) {
      logPass(
        "[POSTS]",
        "My posts includes created post",
        myPosts.status,
        found,
      );
      summary.pass++;
    } else {
      logFail(
        "[POSTS]",
        "Created post not found in my posts",
        myPosts.status,
        myPosts.body,
      );
      summary.fail++;
    }
  } else {
    logFail("[POSTS]", "Get my posts failed", myPosts.status, myPosts.body);
    summary.fail++;
  }

  // Soft delete
  const delSoft = await request(
    "DELETE",
    `/posts/${postId}`,
    undefined,
    token || undefined,
  );
  if (delSoft.ok && delSoft.status === 200 && envelopeValid(delSoft.body)) {
    logPass("[POSTS]", "Soft delete OK", delSoft.status, delSoft.body);
    summary.pass++;
  } else {
    logFail("[POSTS]", "Soft delete failed", delSoft.status, delSoft.body);
    summary.fail++;
  }

  // Check exclusion in my posts
  const myPostsAfter = await request(
    "GET",
    "/posts/my",
    undefined,
    token || undefined,
  );
  if (
    myPostsAfter.ok &&
    myPostsAfter.status === 200 &&
    envelopeValid(myPostsAfter.body)
  ) {
    const found = Array.isArray(myPostsAfter.body.data)
      ? myPostsAfter.body.data.find((p: any) => p.id === postId)
      : null;
    if (!found) {
      logPass(
        "[POSTS]",
        "Soft-deleted post excluded from /posts/my",
        myPostsAfter.status,
      );
      summary.pass++;
    } else {
      logFail(
        "[POSTS]",
        "Soft-deleted post still present in /posts/my",
        myPostsAfter.status,
        myPostsAfter.body,
      );
      summary.fail++;
    }
  }

  // Try hard delete
  const delHard = await request(
    "DELETE",
    `/posts/${postId}?permanent=true`,
    undefined,
    token || undefined,
  );
  if (delHard.ok && delHard.status === 200 && envelopeValid(delHard.body)) {
    logPass("[POSTS]", "Hard delete OK", delHard.status, delHard.body);
    summary.pass++;
  } else {
    logFail("[POSTS]", "Hard delete failed", delHard.status, delHard.body);
    summary.fail++;
  }

  // Optionally check DB via Prisma if available
  let prismaAvailable = false;
  try {
    const mod = await import("../lib/prisma.js");
    const prisma = mod.default || mod.prisma;
    if (prisma && postId) {
      prismaAvailable = true;
      // check post by id
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        logPass("[DB]", "Post not found after hard delete", undefined, null);
        summary.pass++;
      } else {
        logFail("[DB]", "Post still exists after hard delete", undefined, post);
        summary.fail++;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // 8. Envelope validation note was performed per-step above

  console.log("--- SUMMARY ---");
  console.log("Pass:", summary.pass, "Fail:", summary.fail);
  if (summary.errors.length) console.log("Errors:", summary.errors);

  if (summary.fail > 0) process.exitCode = 2;
  else process.exitCode = 0;
})();
