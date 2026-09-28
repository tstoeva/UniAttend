import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import fs from 'fs';

// Схема за структуриран изход: заглавие, резюме, ключови понятия и 5 въпроса с по 4 отговора
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

// Генериране на Smart Catch-up пакети (OpenAI или демо режим)
@Injectable()
export class AiService {
  private client?: OpenAI; // без OPENAI_API_KEY – демо режим
  private logger = new Logger(AiService.name);

  // Създава OpenAI клиент, ако има API ключ (OPENAI_BASE_URL е по избор – друг OpenAI-съвместим адрес)
  constructor(private config: ConfigService, private prisma: PrismaService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    if (key) this.client = new OpenAI({ apiKey: key, baseURL });
  }

  // Създава Smart Catch-up пакет за отсъстващ студент (ако още няма такъв)
  async generateCatchup(sessionId: string, studentId: string) {
    const existing = await this.prisma.catchupPackage.findUnique({ where: { studentId_sessionId: { studentId, sessionId } } });
    if (existing) return existing;

    // Тестът се генерира веднъж за лекцията – следващите отсъстващи получават копие
    const first = await this.prisma.catchupPackage.findFirst({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    const result = first ?? (await this.newPackage(sessionId));
    return this.prisma.catchupPackage.create({
      data: { studentId, sessionId, title: result.title, summary: result.summary, keyConcepts: result.keyConcepts, quiz: result.quiz },
    });
  }

  // Нов пакет за лекцията: от AI при наличен ключ и материали или конспект, иначе резервен
  private async newPackage(sessionId: string) {
    // Лекцията с курса и материалите
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId }, include: { course: true, materials: true } });
    if (!session) throw new Error('Session not found');

    if (this.client && (session.materials.length > 0 || session.syllabus)) {
      try {
        return await this.askOpenAI(this.client, session);
      } catch (error) {
        // Грешка от OpenAI (напр. няма кредит или интернет) – резервен пакет
        this.logger.warn(`OpenAI failed for "${session.title}", using the fallback package: ${(error as Error).message}`);
      }
    }
    return this.demoPackage(session);
  }

  // Изпраща материалите и инструкцията към модела (Chat Completions API) и връща пакета по схемата
  private async askOpenAI(client: OpenAI, session: any) {
    // Текстът на материалите на лектора (файловете в backend/uploads)
    const materials = session.materials
      .map((material: any) => `### ${material.title}\n${fs.readFileSync(material.localPath, 'utf8')}`)
      .join('\n\n');
    // Инструкция към модела (с описанието на темата от конспекта, ако има)
    const outline = session.syllabus ? `\nTopic outline from the course syllabus:\n${session.syllabus}` : '';
    const prompt = `Create a catch-up package for a university student who missed the class "${session.title}" in course "${session.course.name}". Use ONLY the supplied lecturer materials. Do not invent facts. Write the summary in clear Bulgarian unless the materials are primarily English. Include exactly five multiple-choice questions.${outline}\n\nLecturer materials:\n${materials}`;

    // Заявка със структуриран изход по catchupSchema
    const response = await client.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL') || 'gpt-5.6',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_schema', json_schema: { name: 'smart_catchup', strict: true, schema: catchupSchema as any } },
    });
    return JSON.parse(response.choices[0].message.content ?? '');
  }

  // Резервен пакет без AI: по конспекта на темата, ако има такъв
  private demoPackage(session: any) {
    const points = (session.syllabus ?? '').split('\n').map((line: string) => line.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
    if (points.length) {
      const questions = ['Кое от изброените е част от темата', 'Кое твърдение се отнася до темата', 'Какво се разглежда в темата', 'Кое е ключово за темата', 'Кое от изброените се изучава в темата'];
      return {
        title: `Smart Catch-up: ${session.title}`,
        summary: `Пропуснатата лекция „${session.title}“ обхваща: ${points.join('; ')}.`,
        keyConcepts: points.slice(0, 8),
        // Верният отговор е точка от конспекта, на различна позиция във всеки въпрос
        quiz: questions.map((question, i) => {
          const options = ['Несвързано с темата понятие', 'Неточно твърдение', 'Нито едно от изброените'];
          options.splice(i % 4, 0, points[i % points.length]);
          return { question: `${question} „${session.title}“?`, options, correctIndex: i % 4, explanation: 'Верният отговор е от конспекта на темата.' };
        }),
      };
    }
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
}
