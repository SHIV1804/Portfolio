import { siteConfig } from '@/shared/config/site';
import { skillGroups } from '@/widgets/skills-section/ui/SkillsGrid';
import { projects } from '@/entities/project/model/data';

export type CommandHandler = (args: string[]) => string | Promise<string>;

export interface Command {
  name: string;
  description: string;
  handler: CommandHandler;
}

export const commandRegistry: Record<string, Command> = {
  whoami: {
    name: 'whoami',
    description: 'Display current user identity',
    handler: () => `${siteConfig.name} - ${siteConfig.role}\n${siteConfig.description}`,
  },
  help: {
    name: 'help',
    description: 'List all available commands',
    handler: () => {
      const commands = Object.values(commandRegistry)
        .map(cmd => `${cmd.name.padEnd(12)} - ${cmd.description}`)
        .join('\n');
      return `Available commands:\n${commands}`;
    },
  },
  clear: {
    name: 'clear',
    description: 'Clear the terminal screen',
    handler: () => 'CLEAR_TERMINAL',
  },
  exit: {
    name: 'exit',
    description: 'Close the terminal',
    handler: () => 'EXIT_TERMINAL',
  },
  contact: {
    name: 'contact',
    description: 'Display contact information',
    handler: () => {
      return `Email:    ${siteConfig.links.email}\nLinkedIn: ${siteConfig.links.linkedin}\nGitHub:   ${siteConfig.links.github}`;
    },
  },
  skills: {
    name: 'skills',
    description: 'List technical skills',
    handler: () => {
      return `Technical Skills:\n\n${skillGroups
        .map((group) => `${group.title}:\n  ${group.skills.join(', ')}`)
        .join('\n\n')}`;
    },
  },
  projects: {
    name: 'projects',
    description: 'List featured projects',
    handler: () => {
      const list = projects
        .map((p) => `- ${p.slug}: ${p.title}${p.isPlaceholder ? ' (coming soon)' : ''}`)
        .join('\n');
      return `Featured Projects:\n${list}\n\nUse 'open [slug]' to view project details.`;
    },
  },
  open: {
    name: 'open',
    description: 'Open a project or link (e.g., open log-analyser)',
    handler: (args) => {
      if (args.length === 0) return "Usage: open [slug|resume]";
      const target = args[0].toLowerCase();
      if (target === 'resume') {
        window.open('/resume.pdf', '_blank');
        return "Opening resume...";
      }
      const project = projects.find((p) => p.slug === target);
      if (project) {
        window.location.href = project.href;
        return `Navigating to ${target}...`;
      }
      return `Target '${target}' not found.`;
    },
  },
  theme: {
    name: 'theme',
    description: 'Change site theme (light/dark)',
    handler: (args) => {
      if (args.length === 0) return "Usage: theme [light|dark]";
      const theme = args[0].toLowerCase();
      if (theme === 'light' || theme === 'dark') {
        // This will be handled by the hook which has access to useTheme
        return `SET_THEME_${theme.toUpperCase()}`;
      }
      return "Invalid theme. Use 'light' or 'dark'.";
    },
  },
};
