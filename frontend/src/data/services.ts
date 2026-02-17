import { VideoService, APIService, CloudService } from '@kas-flash/shared';

/**
 * ATTACK ON TITAN EPISODES
 * Using actual video files from the project directory
 * 
 * PAYMENT RATE: 0.01 KAS/second
 * Every 30 seconds = 0.3 KAS per transaction
 */
export const VIDEOS: VideoService[] = [
    {
        id: 'aot-s01-e01',
        title: 'Attack on Titan S01 E01',
        description: 'To You, in 2000 Years: The Fall of Shiganshina, Part 1',
        thumbnail: '/api/video-thumbnail/aot-s01-e01',
        videoPath: '/Attack on Titan S01 E01.mkv',
        ratePerSecond: 0.01,
    },
    {
        id: 'aot-s01-e02',
        title: 'Attack on Titan S01 E02',
        description: 'That Day: The Fall of Shiganshina, Part 2',
        thumbnail: '/api/video-thumbnail/aot-s01-e02',
        videoPath: '/Attack on Titan S01 E02.mkv',
        ratePerSecond: 0.01,
    },
    {
        id: 'aot-s01-e03',
        title: 'Attack on Titan S01 E03',
        description: 'A Dim Light Amid Despair: Humanity\'s Comeback, Part 1',
        thumbnail: '/api/video-thumbnail/aot-s01-e03',
        videoPath: '/Attack on Titan S01 E03.mkv',
        ratePerSecond: 0.01,
    },
    {
        id: 'aot-s01-e04',
        title: 'Attack on Titan S01 E04',
        description: 'The Night of the Closing Ceremony: Humanity\'s Comeback, Part 2',
        thumbnail: '/api/video-thumbnail/aot-s01-e04',
        videoPath: '/Attack on Titan S01 E04.mkv',
        ratePerSecond: 0.01,
    },
    {
        id: 'aot-s01-e05',
        title: 'Attack on Titan S01 E05',
        description: 'First Battle: The Struggle for Trost, Part 1',
        thumbnail: '/api/video-thumbnail/aot-s01-e05',
        videoPath: '/Attack on Titan S01 E05.mkv',
        ratePerSecond: 0.01,
    },
];

/**
 * API SERVICES - EXPANDED LIST
 * One-time or recurring payment to access API keys
 */
export const API_SERVICES: APIService[] = [
    // AI/ML APIs
    {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4 API',
        description: 'Advanced language model API',
        icon: '🤖',
        price: 0.5,
        baseUnit: 1000,
        unitType: 'requests',
    },
    {
        id: 'anthropic-claude',
        name: 'Anthropic Claude API',
        description: 'Constitutional AI assistant',
        icon: '🧠',
        price: 0.45,
        baseUnit: 1000,
        unitType: 'requests',
    },
    {
        id: 'stability-ai',
        name: 'Stability AI API',
        description: 'Image generation with Stable Diffusion',
        icon: '🎨',
        price: 0.4,
        baseUnit: 500,
        unitType: 'generations',
    },
    {
        id: 'cohere',
        name: 'Cohere API',
        description: 'NLP and embeddings platform',
        icon: '📝',
        price: 0.35,
        baseUnit: 1000,
        unitType: 'requests',
    },
    {
        id: 'huggingface',
        name: 'HuggingFace Inference API',
        description: 'ML model hosting and inference',
        icon: '🤗',
        price: 0.3,
        baseUnit: 1000,
        unitType: 'requests',
    },

    // Maps & Location APIs
    {
        id: 'google-maps',
        name: 'Google Maps API',
        description: 'Geocoding, routing, and maps',
        icon: '🗺️',
        price: 0.3,
        baseUnit: 5000,
        unitType: 'requests',
    },
    {
        id: 'mapbox',
        name: 'Mapbox API',
        description: 'Custom maps and location data',
        icon: '🌍',
        price: 0.25,
        baseUnit: 5000,
        unitType: 'requests',
    },

    // Payment APIs
    {
        id: 'stripe-payment',
        name: 'Stripe Payment API',
        description: 'Payment processing platform',
        icon: '💳',
        price: 0.4,
        baseUnit: 100,
        unitType: 'transactions',
    },
    {
        id: 'paypal',
        name: 'PayPal API',
        description: 'Digital payments and transfers',
        icon: '💰',
        price: 0.35,
        baseUnit: 100,
        unitType: 'transactions',
    },
    {
        id: 'square',
        name: 'Square API',
        description: 'Commerce and POS platform',
        icon: '🏪',
        price: 0.3,
        baseUnit: 100,
        unitType: 'transactions',
    },

    // Communication APIs
    {
        id: 'sendgrid-email',
        name: 'SendGrid Email API',
        description: 'Email delivery service',
        icon: '📧',
        price: 0.2,
        baseUnit: 1000,
        unitType: 'emails',
    },
    {
        id: 'twilio-sms',
        name: 'Twilio SMS API',
        description: 'SMS messaging platform',
        icon: '📱',
        price: 0.25,
        baseUnit: 500,
        unitType: 'messages',
    },
    {
        id: 'mailchimp',
        name: 'Mailchimp API',
        description: 'Email marketing automation',
        icon: '🐵',
        price: 0.22,
        baseUnit: 1000,
        unitType: 'emails',
    },
    {
        id: 'slack',
        name: 'Slack API',
        description: 'Team communication integration',
        icon: '💬',
        price: 0.18,
        baseUnit: 1000,
        unitType: 'requests',
    },
    {
        id: 'discord',
        name: 'Discord API',
        description: 'Bot and webhook integration',
        icon: '🎮',
        price: 0.15,
        baseUnit: 1000,
        unitType: 'requests',
    },

    // Developer Tools
    {
        id: 'github',
        name: 'GitHub API',
        description: 'Repository and CI/CD access',
        icon: '🐙',
        price: 0.2,
        baseUnit: 2000,
        unitType: 'requests',
    },
    {
        id: 'gitlab',
        name: 'GitLab API',
        description: 'DevOps platform access',
        icon: '🦊',
        price: 0.18,
        baseUnit: 2000,
        unitType: 'requests',
    },
    {
        id: 'jira',
        name: 'Jira API',
        description: 'Project management integration',
        icon: '📊',
        price: 0.22,
        baseUnit: 1000,
        unitType: 'requests',
    },

    // Analytics & Monitoring
    {
        id: 'google-analytics',
        name: 'Google Analytics API',
        description: 'Website analytics data',
        icon: '📈',
        price: 0.25,
        baseUnit: 5000,
        unitType: 'requests',
    },
    {
        id: 'datadog',
        name: 'Datadog API',
        description: 'Infrastructure monitoring',
        icon: '🐕',
        price: 0.35,
        baseUnit: 1000,
        unitType: 'requests',
    },
    {
        id: 'new-relic',
        name: 'New Relic API',
        description: 'APM and observability',
        icon: '📡',
        price: 0.3,
        baseUnit: 1000,
        unitType: 'requests',
    },
];

/**
 * CLOUD SERVICES - EXPANDED LIST
 * Recurring payment to use cloud resources
 */
export const CLOUD_SERVICES: CloudService[] = [
    // Compute
    {
        id: 'aws-ec2',
        name: 'AWS EC2 Instance',
        description: 't2.micro virtual server',
        icon: '☁️',
        price: 0.5,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'aws-lambda',
        name: 'AWS Lambda Functions',
        description: 'Serverless compute execution',
        icon: '⚡',
        price: 0.3,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'google-compute',
        name: 'Google Compute Engine',
        description: 'VM instances on GCP',
        icon: '🔷',
        price: 0.45,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'azure-vm',
        name: 'Azure Virtual Machine',
        description: 'Windows/Linux VMs',
        icon: '🪟',
        price: 0.48,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'digital-ocean-droplet',
        name: 'DigitalOcean Droplet',
        description: 'Basic cloud server',
        icon: '🌊',
        price: 0.42,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'linode',
        name: 'Linode Instance',
        description: 'Cloud computing platform',
        icon: '🔵',
        price: 0.4,
        baseUnit: 1,
        unitType: 'minutes',
    },

    // Storage
    {
        id: 'aws-s3',
        name: 'AWS S3 Storage',
        description: 'Object storage service',
        icon: '💾',
        price: 0.25,
        baseUnit: 30,
        unitType: 'minutes',
    },
    {
        id: 'google-cloud-storage',
        name: 'Google Cloud Storage',
        description: 'Scalable object storage',
        icon: '📦',
        price: 0.28,
        baseUnit: 30,
        unitType: 'minutes',
    },
    {
        id: 'azure-blob',
        name: 'Azure Blob Storage',
        description: 'Massively scalable storage',
        icon: '🗄️',
        price: 0.26,
        baseUnit: 30,
        unitType: 'minutes',
    },

    // Databases
    {
        id: 'aws-rds',
        name: 'AWS RDS Database',
        description: 'Managed relational database',
        icon: '🗃️',
        price: 0.45,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'mongodb-atlas',
        name: 'MongoDB Atlas',
        description: 'Managed NoSQL database',
        icon: '🍃',
        price: 0.4,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'redis-cloud',
        name: 'Redis Cloud',
        description: 'In-memory data store',
        icon: '🔴',
        price: 0.35,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'postgresql',
        name: 'Managed PostgreSQL',
        description: 'Relational database service',
        icon: '🐘',
        price: 0.38,
        baseUnit: 1,
        unitType: 'minutes',
    },

    // CDN & Networking
    {
        id: 'cloudflare-cdn',
        name: 'Cloudflare CDN',
        description: 'Content delivery network',
        icon: '🚀',
        price: 0.32,
        baseUnit: 30,
        unitType: 'minutes',
    },
    {
        id: 'fastly',
        name: 'Fastly CDN',
        description: 'Edge cloud platform',
        icon: '⚡',
        price: 0.35,
        baseUnit: 30,
        unitType: 'minutes',
    },
    {
        id: 'akamai',
        name: 'Akamai CDN',
        description: 'Global CDN service',
        icon: '🌐',
        price: 0.38,
        baseUnit: 30,
        unitType: 'minutes',
    },

    // Serverless
    {
        id: 'azure-function',
        name: 'Azure Functions',
        description: 'Event-driven serverless',
        icon: '⚙️',
        price: 0.28,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'google-cloud-functions',
        name: 'Google Cloud Functions',
        description: 'Lightweight serverless',
        icon: '🔧',
        price: 0.26,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'vercel',
        name: 'Vercel Deployment',
        description: 'Frontend cloud platform',
        icon: '▲',
        price: 0.22,
        baseUnit: 30,
        unitType: 'minutes',
    },
    {
        id: 'netlify',
        name: 'Netlify Hosting',
        description: 'JAMstack platform',
        icon: '🌟',
        price: 0.2,
        baseUnit: 30,
        unitType: 'minutes',
    },

    // Container Services
    {
        id: 'aws-ecs',
        name: 'AWS ECS Container',
        description: 'Container orchestration',
        icon: '🐳',
        price: 0.42,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'k8s',
        name: 'Kubernetes Cluster',
        description: 'Managed Kubernetes',
        icon: '☸️',
        price: 0.5,
        baseUnit: 1,
        unitType: 'minutes',
    },
    {
        id: 'docker-hub',
        name: 'Docker Hub Registry',
        description: 'Container image storage',
        icon: '🐋',
        price: 0.18,
        baseUnit: 30,
        unitType: 'minutes',
    },
];
