import { CreateAxiosDefaults } from "axios";
import { Readable } from "stream";

declare namespace RutrackerApi {
    interface LoginOptions {
        username?: string;
        password?: string;
    }

    interface SearchOptions {
        query: string;
        sort?: "registered" | "title" | "downloads" | "size" | "lastMessage" | "seeds" | "leeches";
        order?: "asc" | "desc";
    }

    interface SessionConfigs {
        cookiesFilePath?: string;
        credentials?: {
            username: string;
            password: string;
        }
    }

    class Torrent {
        id: string;
        category: string;
        title: string;
        author: string;
        state: "проверено" | "не проверено" | "недооформлено" | "сомнительно" | "поглощено" | "временная";
        size: number;
        seeds: number;
        leeches: number;
        downloads: number;
        registered: Date;
        host: string;
        metadata: Array<{ key: string, value: string }>;
        get formattedSize(): string;
        get url(): string;
    }
}

declare class RutrackerApi {
    constructor(
        host?: string,
        httpClientConfigs?: CreateAxiosDefaults,
        sessionConfigs?: RutrackerApi.SessionConfigs
    );

    storeCredentials(username: string, password: string): this;
    storeCookies(cookiesFilePath: string, rutrackerCookieKey?: string): this;
    getCookie(): Promise<string>;
    login(options: RutrackerApi.LoginOptions): Promise<boolean | never>;
    search(options: RutrackerApi.SearchOptions): Promise<RutrackerApi.Torrent[]>;
    find(id: number | string): Promise<RutrackerApi.Torrent>;
    download(id: number | string): Promise<Readable>;
    getMagnetLink(id: number | string): Promise<string>;
}

export = RutrackerApi;
export as namespace RutrackerApi;
