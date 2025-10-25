import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class PromptsService {
  constructor(private prisma: PrismaService) {}

  @Prompt({
    name: 'user-analysis',
    description: 'Analyze user patterns and generate insights',
    parameters: z.object({
      userId: z.string().optional().describe('Specific user ID to analyze'),
      timeframe: z.string().optional().describe('Analysis timeframe'),
      includeMetrics: z.string().optional().describe('Include metrics'),
    }),
  })
  async analyzeUserPatterns({
    userId,
    timeframe = '30d',
    includeMetrics = 'true',
  }: {
    userId?: string;
    timeframe?: string;
    includeMetrics?: string;
  }) {
    const days =
      timeframe === '7d'
        ? 7
        : timeframe === '90d'
          ? 90
          : timeframe === '1y'
            ? 365
            : 30;
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let analysisPrompt = `# User Analysis Report

## Analysis Parameters
- **Timeframe**: ${timeframe} (last ${days} days)
- **Date Range**: ${dateFrom.toLocaleDateString()} to ${new Date().toLocaleDateString()}
- **Include Metrics**: ${includeMetrics}

## Instructions for AI Assistant

You are analyzing user data from our application. Please provide insights based on the following data:

`;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new ForbiddenException('User not found or access denied');
      }

      analysisPrompt += `### Single User Analysis: ${user.name}

**User Details:**
- ID: ${user.id}
- Email: ${user.email}
- Role: ${user.role}
- Account Created: ${user.createdAt.toLocaleDateString()}
- Last Updated: ${user.updatedAt.toLocaleDateString()}
- Account Age: ${Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days

**Analysis Questions:**
1. How active has this user been based on their account age?
2. What insights can you provide about their role and permissions?
3. Are there any patterns in their account updates?
4. What recommendations would you make for user engagement?
`;
    } else {
      const [totalUsers, recentUsers, adminUsers] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { createdAt: { gte: dateFrom } },
        }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
      ]);

      analysisPrompt += `### Overall User Base Analysis

**Current Statistics:**
- Total Users: ${totalUsers}
- New Users (${timeframe}): ${recentUsers}
- Admin Users: ${adminUsers}
- Regular Users: ${totalUsers - adminUsers}

**Growth Metrics:**
- New user acquisition rate: ${((recentUsers / totalUsers) * 100).toFixed(1)}%

**Analysis Questions:**
1. What trends do you see in user growth over the ${timeframe} period?
2. Is the ratio of admin to regular users appropriate for this application?
3. What insights can you provide about user acquisition patterns?
4. What recommendations would you make for improving user engagement and retention?
`;
    }

    analysisPrompt += `
## Output Format

Please structure your analysis as follows:

1. **Executive Summary** - Key findings in 2-3 sentences
2. **Detailed Insights** - Answer the analysis questions above
3. **Trends and Patterns** - What patterns do you observe?
4. **Recommendations** - Specific, actionable recommendations
5. **Risk Assessment** - Any potential concerns or risks identified

Use clear headings and bullet points for readability.
`;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: analysisPrompt,
          },
        },
      ],
    };
  }

  @Prompt({
    name: 'user-report',
    description: 'Generate a comprehensive user report',
    parameters: z.object({
      userId: z.string().optional().describe('Specific user ID'),
      format: z.string().optional().describe('Report format'),
      includePermissions: z.string().optional().describe('Include permissions'),
    }),
  })
  async generateUserReport({
    userId,
    format = 'summary',
    includePermissions = 'false',
  }: {
    userId?: string;
    format?: string;
    includePermissions?: string;
  }) {
    let reportPrompt = `# User Report Generation

## Report Configuration
- **Type**: ${userId ? 'Individual User Report' : 'System-wide User Report'}
- **Format**: ${format}
- **Include Permissions**: ${includePermissions}
- **Generated**: ${new Date().toLocaleString()}

## AI Assistant Instructions

Generate a professional report based on the provided data. Use the format level "${format}".

`;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new ForbiddenException('User not found or access denied');
      }

      reportPrompt += `### Individual User Report Data

**Subject**: ${user.name} (${user.email})

**Basic Information:**
- User ID: ${user.id}
- Display Name: ${user.name}
- Email Address: ${user.email}
- Account Role: ${user.role}
- Account Created: ${user.createdAt.toISOString()}
- Last Modified: ${user.updatedAt.toISOString()}
- Account Age: ${Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days

Generate a comprehensive report analyzing this user's profile and activity.
`;
    } else {
      const [totalUsers, adminCount, userCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.user.count({ where: { role: 'USER' } }),
      ]);

      reportPrompt += `### System-wide User Report Data

**Overall Statistics:**
- Total Users: ${totalUsers}
- Administrator Accounts: ${adminCount}
- Regular User Accounts: ${userCount}

Generate a comprehensive system-wide report analyzing user distribution and system health.
`;
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: reportPrompt,
          },
        },
      ],
    };
  }

  @Prompt({
    name: 'security-audit',
    description: 'Generate security audit analysis',
    parameters: z.object({
      scope: z.string().optional().describe('Audit scope'),
      severity: z.string().optional().describe('Severity level'),
    }),
  })
  async generateSecurityAudit({
    scope = 'full',
    severity = 'medium',
  }: {
    scope?: string;
    severity?: string;
  }) {
    const [totalUsers, adminCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    const auditPrompt = `# Security Audit Analysis

## Audit Configuration
- **Scope**: ${scope}
- **Minimum Severity**: ${severity}
- **Audit Date**: ${new Date().toISOString()}

## System Data

**User Account Statistics:**
- Total Accounts: ${totalUsers}
- Administrator Accounts: ${adminCount}
- Admin Percentage: ${((adminCount / totalUsers) * 100).toFixed(1)}%

## Security Analysis Instructions

Analyze the user management system for security concerns and provide recommendations for:

1. **User Account Security**
2. **Permission Management**
3. **Access Control**
4. **System Architecture**

Generate a comprehensive security audit report with findings and recommendations.
`;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: auditPrompt,
          },
        },
      ],
    };
  }
}
