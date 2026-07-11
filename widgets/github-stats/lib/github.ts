import { siteConfig } from '@/shared/config/site';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export interface GitHubData {
  user: {
    repositories: {
      totalCount: number;
      nodes: {
        stargazerCount: number;
        languages: {
          edges: {
            size: number;
            node: {
              name: string;
              color: string;
            };
          }[];
        };
      }[];
    };
    pinnedItems: {
      nodes: {
        name: string;
        description: string;
        url: string;
        stargazerCount: number;
        forkCount: number;
        primaryLanguage: {
          name: string;
          color: string;
        } | null;
      }[];
    };
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: {
          contributionDays: {
            contributionCount: number;
            date: string;
            color: string;
          }[];
        }[];
      };
    };
  };
}

const GITHUB_QUERY = `
  query($username: String!) {
    user(login: $username) {
      repositories(first: 100, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }
`;

export async function getGitHubData(): Promise<GitHubData | null> {
  const token = process.env.GITHUB_TOKEN;
  const username = siteConfig.links.github.split('/').pop();

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN or username in siteConfig');
    return null;
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GITHUB_QUERY,
        variables: { username },
      }),
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
    }

    return json.data;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return null;
  }
}

export function processGitHubStats(data: GitHubData) {
  const { user } = data;
  
  // Stats Row
  const totalRepos = user.repositories.totalCount;
  const totalStars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0);
  const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;

  // Language Breakdown
  const languages: Record<string, number> = {};
  user.repositories.nodes.forEach((repo) => {
    repo.languages.edges.forEach((edge) => {
      languages[edge.node.name] = (languages[edge.node.name] || 0) + edge.size;
    });
  });

  const totalSize = Object.values(languages).reduce((acc, size) => acc + size, 0);
  const languageStats = Object.entries(languages)
    .map(([name, size]) => ({
      name,
      percentage: Math.round((size / totalSize) * 100),
      size,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  return {
    totalRepos,
    totalStars,
    totalContributions,
    languageStats,
    pinnedRepos: user.pinnedItems.nodes,
    calendar: user.contributionsCollection.contributionCalendar,
  };
}
