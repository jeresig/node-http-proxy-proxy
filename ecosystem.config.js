export default {
    apps: [
        {
            name: "proxy-server",
            script: "./dist/index.js",
            instances: 1,
            exec_mode: "fork",
            node_args: "--env=production",
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            env: {
                NODE_ENV: "production",
            },
            env_production: {
                NODE_ENV: "production",
            },
            exp_backoff_restart_delay: 100,
            // Log configuration
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            error_file: "logs/error.log",
            out_file: "logs/out.log",
            merge_logs: true,
            log_type: "json",
        },
    ],
};
