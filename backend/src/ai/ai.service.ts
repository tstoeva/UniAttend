import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import fs from 'fs';

const catchupSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    keyConcepts: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 },
    quiz: {
      type: 'array', minItems: 5, maxItems: 5,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' }
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
        additionalProperties: false
      }
    }
  },
  required: ['title', 'summary', 'keyConcepts', 'quiz'],
  additionalProperties: false
} as const;

@Injectable()
export class AiService {
  private client?: OpenAI;
  constructor(private config: ConfigService, private prisma: PrismaService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (key) this.client = new OpenAI({ apiKey: key });
  }

  private demoPackage(session: any) {
    return {
      title: `Smart Catch-up: ${session.title}`,
      summary: `This demo catch-up was generated without an OpenAI API key. Review the lecturer materials for ${session.title}. The production mode sends only lecturer-provided materials to the model and returns a grounded summary plus a five-question quiz.`,
      keyConcepts: ['Core concepts from the session', 'Important terminology', 'Practical application', 'Exam-oriented review'],
      quiz: [1, 2, 3, 4, 5].map((n) => ({
        question: `Demo question ${n}: Which statement best reflects the material from ${session.title}?`,
        options: ['Correct concept from the session', 'Unrelated concept', 'Incorrect assumption', 'None of the above'],
        correctIndex: 0,
        explanation: 'In demo mode the first answer is intentionally correct. Add OPENAI_API_KEY for material-grounded questions.'
      }))
    };
  }

  async generateCatchup(sessionId: string, studentId: string) {
    const existing = await this.prisma.catchupPackage.findUnique({ where: { studentId_sessionId: { studentId, sessionId } } });
    if (existing) return existing;

    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { course: true, materials: true },
    });
    if (!session) throw new Error('Session not found');

    let result: any = this.demoPackage(session);
    if (this.client && session.materials.length > 0) {
      const content: any[] = [];
      for (const material of session.materials) {
        let openaiFileId = material.openaiFileId;
        if (!openaiFileId) {
          const uploaded = await this.client.files.create({
            file: fs.createReadStream(material.localPath),
            purpose: 'user_data',
          });
          openaiFileId = uploaded.id;
          await this.prisma.material.update({ where: { id: material.id }, data: { openaiFileId } });
        }
        content.push({ type: 'input_file', file_id: openaiFileId });
      }
      content.push({
        type: 'input_text',
        text: `Create a catch-up package for a university student who missed the class "${session.title}" in course "${session.course.name}". Use ONLY the supplied lecturer materials. Do not invent facts. Write the summary in clear Bulgarian unless the materials are primarily English. Include exactly five multiple-choice questions.`
      });

      const response = await this.client.responses.create({
        model: this.config.get<string>('OPENAI_MODEL') || 'gpt-5.6',
        input: [{ role: 'user', content } as any],
        text: {
          format: {
            type: 'json_schema',
            name: 'smart_catchup',
            strict: true,
            schema: catchupSchema as any,
          }
        }
      });
      result = JSON.parse(response.output_text);
    }

    return this.prisma.catchupPackage.create({
      data: {
        studentId,
        sessionId,
        title: result.title,
        summary: result.summary,
        keyConcepts: result.keyConcepts,
        quiz: result.quiz,
      }
    });
  }
}
