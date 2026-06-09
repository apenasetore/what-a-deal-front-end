import type { NewDeal } from "../types";

const PRIV_KEY_PREFIX = "store_priv_key:";

// Algoritmo compativel com o backend (Shared.Crypto, RSA 2048 + SHA-256,
// RSASSA-PKCS1-v1_5). A assinatura gerada pelo WebCrypto e verificada
// diretamente por :public_key.verify/4 no Erlang/OTP, sem conversao de formato.
const RSA_ALG = {
  name: "RSASSA-PKCS1-v1_5",
  hash: "SHA-256",
} as const;

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
    {
      ...RSA_ALG,
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  );

  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  localStorage.setItem(PRIV_KEY_PREFIX + nome, toPem(pkcs8, "PRIVATE KEY"));

  return toPem(spki, "PUBLIC KEY");
}

// Mensagem canonica assinada/verificada. O backend reconstroi exatamente esta
// string (mesma ordem de campos, precos com 2 casas decimais) antes de
// verificar a assinatura. Mantemos os campos juntos por "|".
// Obs.: um "|" literal dentro de um campo de texto e uma ambiguidade teorica,
// aceitavel para este projeto.
export function canonicalDeal(deal: NewDeal): string {
  return [
    deal.loja,
    deal.nome,
    deal.descricao,
    deal.categoria,
    deal.email,
    deal.preco_original.toFixed(2),
    deal.preco_promocional.toFixed(2),
  ].join("|");
}

export async function getSignature(deal: NewDeal): Promise<string> {
  const { loja } = deal;
  const privKeyPem = getStorePrivateKey(loja);
  if (!privKeyPem) throw new Error("Chave privada da loja não encontrada.");

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    strToArrayBuffer(privKeyPem),
    RSA_ALG,
    false,
    ["sign"],
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalDeal(deal));

  const signature = await crypto.subtle.sign(RSA_ALG.name, privKey, data);

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
