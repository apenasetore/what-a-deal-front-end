const PRIV_KEY_PREFIX = "store_priv_key:";

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function toPem(buf: ArrayBuffer, label: string): string {
  const b64 = bufToBase64(buf);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

export async function generateStoreKeys(nome: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  localStorage.setItem(PRIV_KEY_PREFIX + nome, toPem(pkcs8, "PRIVATE KEY"));

  return toPem(spki, "PUBLIC KEY"); 
}

export async function getSignature(deal: NewDeal): Promise<string> {
  const { loja } = deal;
  const privKeyPem = getStorePrivateKey(loja);
  if (!privKeyPem) throw new Error("Chave privada da loja não encontrada.");

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    strToArrayBuffer(privKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(deal));

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privKey,
    data,
  );

  return bufToBase64(signature);
}

function strToArrayBuffer(str: string): ArrayBuffer {
  const binary = atob(str.replace(/-----.*?-----|\s/g, ""));
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
} 

export function getStorePrivateKey(nome: string): string | null {
  return localStorage.getItem(PRIV_KEY_PREFIX + nome);
}
