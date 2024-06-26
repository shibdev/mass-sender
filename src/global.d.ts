import { Buffer as _Buffer } from 'buffer';

declare global {
  var Buffer: typeof _Buffer;
  interface Global {
    Buffer: typeof _Buffer;
  }
}