// Разчита конспект във формат „## Тема N: Заглавие“ с описание под всяко заглавие
export function parseSyllabus(text: string) {
  const topics: { title: string; description: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s*Тема\s*\d+\s*[:.–—-]\s*(.+?)\s*$/iu);
    if (heading) topics.push({ title: heading[1], description: '' });
    else if (topics.length) topics[topics.length - 1].description += line + '\n';
  }
  return topics.map((topic) => ({ title: topic.title, description: topic.description.trim() }));
}
