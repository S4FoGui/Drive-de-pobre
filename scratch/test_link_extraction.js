const extractLinks = (text) => {
  const links = [];
  let cleanedText = text;

  // 1. Extract markdown links [Title](url)
  // We use [\s\S]*? for title to handle potential newlines inside brackets,
  // and [^\s\)]+ for URL.
  const mdRegex = /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g;
  cleanedText = cleanedText.replace(mdRegex, (match, title, url) => {
    links.push({ title: title.trim() || 'Novo Material', url: url.trim() });
    return `[LINK]`;
  });

  // 2. Extract remaining plain URLs
  const plainRegex = /(https?:\/\/[^\s]+)/g;
  cleanedText = cleanedText.replace(plainRegex, (match, url) => {
    links.push({ title: 'Novo Material', url: url.trim() });
    return `[LINK]`;
  });

  return { links, cleanedText };
};

const sampleInput = `
adicione na materia RC estes links:
[Rc 377 10 no ataque, acerte sua mentalidade](https://www.youtube.com/watch?v=YUgVLtwliT8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=1&pp=iAQB)
[RC 376 PERSEGUIÇÃO NO TRABALHO, como vencer?](https://www.youtube.com/watch?v=SQyvj7vCsZI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=2&pp=iAQB)

e esse tbm:
https://youtube.com/watch?v=12345
`;

console.log(extractLinks(sampleInput));
