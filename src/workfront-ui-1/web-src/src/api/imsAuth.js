/*
 * <license header>
 */

/**
 * Reads chat context from the UIX guest shared context: the signed-in user's
 * IMS token + org id (to authorize the agent call) and the current project id
 * (`objID`, sent to the agent so it knows which project to answer about).
 * Returns nulls (never throws) when unavailable, e.g. local dev with no host.
 */
import { getGuestConnection } from './guestConnection';

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('IMS auth timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function getImsAuth() {
  try {
    const conn = await withTimeout(getGuestConnection(), 3000);
    const context = conn && conn.sharedContext;
    const auth = context ? await context.get('auth') : null;
    const projectId = context ? await context.get('objID') : null;
    const hostname = context ? await context.get('hostname') : null;
    return {
      imsToken: (auth && (auth.imsToken || auth.token)) || null,
      imsOrg: (auth && (auth.imsOrg || auth.imsOrgId || auth.imsOrgID || auth.orgId)) || null,
      projectId: projectId || null,
      hostname: hostname || null,
    };
  } catch (error) {
    return { imsToken: null, imsOrg: null, projectId: null, hostname: null };
  }
}

export default getImsAuth;
