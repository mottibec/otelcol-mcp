import { Octokit } from "@octokit/rest";
import { Component, ComponentConfig, GitHubContentResponse } from './types.js';

const REPO_OWNER = 'open-telemetry';
const REPO_NAME = 'opentelemetry-collector-contrib';

// Create Octokit instance
const octokit = new Octokit();

export async function fetchComponents(type: 'receiver' | 'processor' | 'exporter'): Promise<Component[]> {
    console.log(`Fetching ${type}s from GitHub`);
    try {
        const { data: contents } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: type,
        });

        if (!Array.isArray(contents)) {
            throw new Error(`Unexpected response format for ${type}s`);
        }

        const components: Component[] = [];

        for (const item of contents) {
            if (item.type === 'dir') {
                try {
                    const { data: readmeData } = await octokit.repos.getContent({
                        owner: REPO_OWNER,
                        repo: REPO_NAME,
                        path: `${type}/${item.name}/README.md`,
                    });

                    if ('content' in readmeData) {
                        const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
                        
                        // Extract stability from README
                        const stabilityMatch = content.match(/Stability:\s*([^\n]+)/);
                        const stability = stabilityMatch ? stabilityMatch[1].trim() : 'Unknown';
                        
                        // Extract description (first paragraph)
                        const descriptionMatch = content.match(/^([^\n]+)/);
                        const description = descriptionMatch ? descriptionMatch[1].trim() : 'No description available';

                        components.push({
                            name: item.name,
                            description,
                            stability,
                            readmeUrl: readmeData.html_url || '',
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to fetch README for ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }

        return components;
    } catch (error) {
        throw new Error(`Failed to fetch ${type}s: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function fetchComponentConfig(type: 'receiver' | 'processor' | 'exporter', name: string): Promise<ComponentConfig> {
    console.log(`Fetching ${type} ${name} config from GitHub`);
    try {
        const { data: readmeData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: `${type}/${name}/README.md`,
        });

        if (!('content' in readmeData)) {
            throw new Error('Failed to fetch README content');
        }

        const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        
        // Extract stability
        const stabilityMatch = content.match(/Stability:\s*([^\n]+)/);
        const stability = stabilityMatch ? stabilityMatch[1].trim() : 'Unknown';
        
        // Extract description (first paragraph)
        const descriptionMatch = content.match(/^([^\n]+)/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'No description available';
        
        // Extract configuration section
        const configMatch = content.match(/## Configuration\n\n([\s\S]*?)(?=\n\n##|$)/);
        const configuration = configMatch ? configMatch[1].trim() : 'No configuration documentation available';

        return {
            name,
            description,
            stability,
            configuration,
        };
    } catch (error) {
        throw new Error(`Failed to fetch ${type} ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 