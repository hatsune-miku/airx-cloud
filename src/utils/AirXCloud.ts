import Net from "./Network.js";
import Hash from "./Hash";
import {StorageKey} from "./Storage.js";

// @ts-ignore
import {ElMessageBox} from "element-plus";

export interface SignInResponse {
    success: boolean;
    message: string;
    name?: string;
    token?: string;
}

export interface RenewResponse {
    success: boolean;
    message: string;
    token?: string;
}

export interface GreetingsResponse {
    success: boolean;
    message: string;
    name?: string;
    uid?: string;
    validBefore?: Date;
}

export interface File {
    id: number;
    name: string;
    user: User,
    fileStore: FileStore,
}

export interface QueryShareResponse {
    success: boolean;
    message: string;
    file?: File;
}

export interface FileShareResponse {
    success: boolean;
    message: string;
    shareId?: string;
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    numberOfElements: number;
}

export interface User {
    id: number
    uid: number
    name: string
}

export interface FileStore {
    id: number
    sha256: string
    size: number
    uploadedAt: string
}

export interface FileShare {
    id: number
    file: File
    user: User
    visits: number
    downloads: number
    alias: string
}

export interface SignUpRequest {
    email: string
    nickname: string
    password: string
}

export interface SignUpResponse {
    success: boolean
    message: string
    uid?: number
}


export interface CheckEmailResponse {
    taken: Boolean
}

export interface FileResponse {
    success: boolean
    message: string
}

export class AirXCloud {
    static async signIn(uid: string, password: string): Promise<SignInResponse> {
        const passwordDoubleHashed = Hash.sha256(Hash.sha256(password))
        const response = await Net.post("/auth/token", {
            uid: uid,
            password: passwordDoubleHashed,
            salt: Net.saltForLogin(passwordDoubleHashed, uid),
        }, false)

        if (response.data.token) {
            localStorage.setItem(StorageKey.uid, uid)
            localStorage.setItem(StorageKey.username, response.data.name)
            localStorage.setItem(StorageKey.token, response.data.token)
            localStorage.setItem(StorageKey.roles, "User")
        }
        return response.data
    }

    static async renew(): Promise<RenewResponse> {
        return (await Net.post("/auth/renew", {}, true)).data
    }

    static async greetings(): Promise<GreetingsResponse> {
        return (await Net.get("/api/v1/greetings", {}, true)).data
    }

    static async getMyFiles(pageIndex: number, pageSize: number, search: string): Promise<Page<File>> {
        const params = {
            page: pageIndex,
            size: pageSize,
            search: search,
        }
        return (await Net.get("/api/v1/file", params, true)).data
    }

    static getUploadUrl(): string {
        return Net.baseUrl() + "/api/v1/file"
    }

    static async downloadFile(filename: string, fileId: number) {
        const url = Net.baseUrl() + "/api/v1/file/" + fileId
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    static async deleteFile(id: number): Promise<FileResponse> {
        return (await Net.delete("/api/v1/file/" + id, {}, true)).data
    }

    static async renameFile(id: number, name: string): Promise<FileResponse> {
        return (await Net.put("/api/v1/file/" + id, {name: name}, true)).data
    }

    static async getMyShares(pageIndex: number, pageSize: number): Promise<Page<FileShare>> {
        const params = {
            page: pageIndex,
            size: pageSize,
        }
        return (await Net.get("/api/v1/share", params, true)).data
    }

    static async deleteShare(alias: string): Promise<FileShareResponse> {
        return (await Net.delete("/api/v1/share/" + alias, {}, true)).data
    }

    static makeShareLink(alias: string): string {
        const baseUrl = location.href
            .replace("://", ":!!")
            .split("/")[0]
            .replace(":!!", "://");
        return `${baseUrl}/share/${alias}`
    }

    static async querySingleShare(alias: string): Promise<QueryShareResponse> {
        return (await Net.get("/api/v1/share/" + alias, {}, true)).data
    }

    static async createShare(fileId: number): Promise<FileShareResponse> {
        return (await Net.post("/api/v1/share", {fileId: fileId}, true)).data
    }

    static async checkEmail(email: string): Promise<CheckEmailResponse> {
        return (await Net.get(`/auth/check-email/${email}`, {}, false)).data
    }

    static async signUp(request: SignUpRequest): Promise<SignUpResponse> {
        return (await Net.post("/auth/sign-up", request, false)).data
    }

    static isLoggedIn(): boolean {
        return localStorage.getItem('token') !== null
    }

    static logout() {
        localStorage.removeItem('token')
    }
}
