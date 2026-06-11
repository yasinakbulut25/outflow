// Tüm kullanıcı girişlerinin azami uzunlukları ve sayısal sınırları tek yerde.
// Amaç: aşırı büyük payload / DoS / DB taşması / UI bozulmasına karşı istemci
// tarafında kontrolü elde tutmak. Bu sınırlar UX + ilk savunma katmanıdır;
// asıl güvenlik doğrulaması yine sunucuda yapılmalı (istemci atlatılabilir).
export const LIMITS = {
  // Metin alanları (karakter)
  name: 80,
  email: 254, // RFC 5321 azami e-posta uzunluğu
  password: 128,
  title: 100,
  itemName: 80,
  note: 255,
  savingsQuantity: 60,

  // Sayısal sınırlar
  maxItems: 50, // tek harcamada azami kalem sayısı
  amountIntDigits: 12, // tutarın tam kısmının azami hane sayısı (≈ 1 trilyon altı)
} as const;
