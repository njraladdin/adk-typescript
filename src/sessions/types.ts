

export interface Part {
  text?: string;
  data?: Uint8Array;
  mimeType?: string;
}

// Create a namespace with the same name as the interface to add static methods
export namespace Part {
  export function fromBytes(data: Uint8Array, mimeType: string): Part {
    return {
      data,
      mimeType
    };
  }
}

export interface Content {
  role: string;
  parts: Part[];
} 