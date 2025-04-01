import { RestEndpointMethodTypes } from "@octokit/rest";

export interface Component {
    name: string;
    description: string;
    stability: string;
    readmeUrl: string;
}

export interface ComponentConfig {
    name: string;
    description: string;
    stability: string;
    configuration: string;
}

export type GitHubContentResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"]; 