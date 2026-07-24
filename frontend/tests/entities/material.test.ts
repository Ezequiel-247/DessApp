import { describe, it, expect } from "vitest";
import { MATERIAL_TYPE } from "@/entities/Material";
import { normalizeMaterial, denormalizeMaterial } from "@/entities/Material/model/material";

describe("MATERIAL_TYPE", () => {
  it("define los tipos esperados", () => {
    expect(MATERIAL_TYPE.PDF).toBe("pdf");
    expect(MATERIAL_TYPE.VIDEO).toBe("video");
    expect(MATERIAL_TYPE.LINK).toBe("link");
  });
});

describe("normalizeMaterial", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      id_subject: 10,
      title: "Parcial 2024",
      type: "pdf",
      file_url: "https://example.com/file.pdf",
      uploadedAt: "2024-06-01T00:00:00Z",
      id_author: 5,
      author_name: "Pepe García",
      total_upvotes: 12,
      status: "active",
    };

    const result = normalizeMaterial(raw);
    expect(result.id).toBe("1");
    expect(result.subjectId).toBe("10");
    expect(result.title).toBe("Parcial 2024");
    expect(result.type).toBe("pdf");
    expect(result.fileUrl).toBe("https://example.com/file.pdf");
    expect(result.authorId).toBe("5");
    expect(result.authorName).toBe("Pepe García");
    expect(result.totalUpvotes).toBe(12);
    expect(result.status).toBe("active");
  });

  it("usa fallback camelCase para campos opcionales", () => {
    const raw = {
      id: 2,
      subjectId: "20",
      title: "Video",
      type: "video",
      fileUrl: "https://youtube.com/watch?v=xyz",
      authorId: "3",
      totalUpvotes: 0,
      status: "active",
    };

    const result = normalizeMaterial(raw);
    expect(result.subjectId).toBe("20");
    expect(result.fileUrl).toBe("https://youtube.com/watch?v=xyz");
    expect(result.authorId).toBe("3");
  });

  it("usa subject_id como fallback para subjectId", () => {
    const raw = { id: 3, subject_id: 99, title: "Link", type: "link", status: "active" };
    const result = normalizeMaterial(raw);
    expect(result.subjectId).toBe("99");
  });

  it("usa url como fallback para fileUrl", () => {
    const raw = { id: 3, title: "Link", type: "link", url: "https://example.com", status: "active" };
    const result = normalizeMaterial(raw);
    expect(result.fileUrl).toBe("https://example.com");
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 4 };
    const result = normalizeMaterial(raw);
    expect(result.subjectId).toBe("");
    expect(result.title).toBe("");
    expect(result.type).toBe("pdf");
    expect(result.fileUrl).toBe(null);
    expect(result.authorId).toBe("");
    expect(result.authorName).toBeUndefined();
    expect(result.totalUpvotes).toBe(0);
    expect(result.status).toBe("active");
  });
});

describe("denormalizeMaterial", () => {
  it("convierte camelCase a snake_case para el backend", () => {
    const data = {
      subjectId: "10",
      title: "Parcial",
      type: "pdf" as const,
      fileUrl: "https://example.com/file.pdf",
      authorId: "5",
      totalUpvotes: 3,
      status: "active",
    };

    const result = denormalizeMaterial(data);
    expect(result.id_subject).toBe("10");
    expect(result.title).toBe("Parcial");
    expect(result.type).toBe("pdf");
    expect(result.file_url).toBe("https://example.com/file.pdf");
    expect(result.id_author).toBe("5");
    expect(result.total_upvotes).toBe(3);
    expect(result.status).toBe("active");
  });

  it("omite campos no presentes en el input parcial", () => {
    const result = denormalizeMaterial({ title: "Solo titulo" });
    expect(result.title).toBe("Solo titulo");
    expect(result).not.toHaveProperty("id_subject");
    expect(result).not.toHaveProperty("file_url");
  });
});
