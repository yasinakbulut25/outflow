/// <reference types="nativewind/types" />

// CSS side-effect / module import'larını TypeScript için tanımla.
// (Metro + NativeWind bunları derleme zamanında çözer; bu yalnız tsc içindir.)
declare module '*.css';
