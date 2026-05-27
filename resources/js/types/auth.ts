export type User = {
    id: number;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    unreadNotificationsCount?: number;
    notifications?: Array<{
        id: string;
        data: {
            ticket_id: string;
            ticket_code: string;
            ticket_title: string;
            message: string;
            type: 'created' | 'assigned' | 'status_changed' | 'comment_added';
        };
        read_at: string | null;
        created_at: string;
    }>;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
