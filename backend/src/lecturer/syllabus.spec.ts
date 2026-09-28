import { parseSyllabus } from './syllabus';

// Тестове за разчитането на конспекта
describe('parseSyllabus', () => {
  it('reads topic titles and descriptions', () => {
    const text = '# Конспект: SA101\n\n## Тема 1: MVC\n- модел\n- изглед\n\n## Тема 2 – MVVM\n- data binding\n';
    expect(parseSyllabus(text)).toEqual([
      { title: 'MVC', description: '- модел\n- изглед' },
      { title: 'MVVM', description: '- data binding' },
    ]);
  });

  it('returns no topics for text without topic headings', () => {
    expect(parseSyllabus('# Конспект\nсамо текст')).toEqual([]);
  });
});
