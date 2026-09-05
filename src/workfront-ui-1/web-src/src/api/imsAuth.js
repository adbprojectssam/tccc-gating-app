/*
 * <license header>
 */

/**
 * Reads the signed-in user's IMS token + org id from the UIX guest shared
 * context — used to authorize Adobe API calls (e.g. the agent chat). Returns
 * nulls (never throws) when unavailable, e.g. local dev with no host.
 */
import { attach } from '@adobe/uix-guest';
import { extensionId } from '../components/Constants';

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('IMS auth timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function getImsAuth() {
  try {
    const conn = await withTimeout(attach({ id: extensionId }), 3000);
    const context = conn && conn.sharedContext;
    const auth = context ? await context.get('auth') : null;
    return {
      imsToken: (auth && (auth.imsToken || auth.token)) || null,
      imsOrg: (auth && (auth.imsOrg || auth.imsOrgId || auth.imsOrgID || auth.orgId)) || null,
    };
  } catch (error) {
    return { imsToken: null, imsOrg: null };
  }
}

export default getImsAuth;
