export interface Signer {
  id: string
  name: string
  email: string
}

export interface SignatureField {
  id: string
  type: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  page: number
  signerId: string
  isLocked?: boolean
}

export interface DocumentField {
  id: string
  type: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  page: number
  content?: string
}

export type ContractObjectType = "text" | "date" | "photo" | "signature"

export interface ContractObject {
  id: string
  type: ContractObjectType
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  page: number
  content?: string
  properties?: {
    name?: string
    email?: string
    phone?: string
    [key: string]: any
  }
}
