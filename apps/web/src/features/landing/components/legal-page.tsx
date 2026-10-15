import type { LegalDocument } from "../i18n/copy";

export const LegalPage = ({ document }: { document: LegalDocument }) => (
  <article className="container mx-auto max-w-3xl px-4 py-10">
    <h1 className="text-3xl font-bold">{document.title}</h1>
    <p className="text-muted-foreground mt-2 text-sm">{document.lastUpdated}</p>
    <div className="mt-8 grid gap-8">
      {document.sections.map((section) => (
        <section key={section.heading} className="grid gap-2">
          <h2 className="text-primary text-xl font-semibold">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="list-disc space-y-1 ps-6">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  </article>
);
