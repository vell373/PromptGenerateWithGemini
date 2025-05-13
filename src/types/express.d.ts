declare module 'express' {
    import { IncomingMessage, ServerResponse } from 'http';

    export interface Request extends IncomingMessage {
    // Add any custom properties you need
    }

    export interface Response extends ServerResponse {
    send(body: any): Response;
    json(body: any): Response;
    status(code: number): Response;
    }

    export interface Application {
    get(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number | string, callback?: () => void): any;  
    }

    export default function express(): Application;
}