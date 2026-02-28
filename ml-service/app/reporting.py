from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _to_percent(value: float) -> str:
    return f"{value * 100:.2f}%"


def generate_model_report_pdf(
    output_path: Path,
    metrics: dict,
    confusion_matrix_values: list[list[int]],
    feature_importance: list[dict],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
    )

    styles = getSampleStyleSheet()
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], spaceAfter=6)
    normal = styles["BodyText"]

    report = metrics.get("classification_report", {})
    macro = report.get("macro avg", {})
    weighted = report.get("weighted avg", {})
    age_group_accuracy = metrics.get("age_group_accuracy", {})

    flow = [
        Paragraph("Maternal-Guard Model Report", styles["Title"]),
        Spacer(1, 6),
        Paragraph(f"Model version: {metrics.get('model_version', 'unknown')}", normal),
        Paragraph(f"Dataset rows: {metrics.get('dataset_rows', 0)}", normal),
        Paragraph(f"Test accuracy: {_to_percent(metrics.get('test_accuracy', 0.0))}", normal),
        Spacer(1, 10),
        Paragraph("Aggregate Metrics", heading),
        Paragraph(
            "Macro F1: "
            f"{macro.get('f1-score', 0.0):.4f} | "
            "Weighted F1: "
            f"{weighted.get('f1-score', 0.0):.4f}",
            normal,
        ),
        Spacer(1, 8),
        Paragraph("Age Group Accuracy (Bias Monitoring)", heading),
    ]

    age_rows = [["Age Group", "Accuracy"]]
    for group, score in age_group_accuracy.items():
        age_rows.append([group, _to_percent(score)])
    age_table = Table(age_rows, colWidths=[70 * mm, 45 * mm])
    age_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e6f0f2")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9fb6bd")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    flow.extend([age_table, Spacer(1, 10), Paragraph("Confusion Matrix", heading)])

    labels = ["Actual \\ Pred", "Low", "Medium", "High"]
    matrix_rows = [labels]
    class_labels = ["Low", "Medium", "High"]
    for index, row in enumerate(confusion_matrix_values):
        matrix_rows.append([class_labels[index], *[str(value) for value in row]])
    matrix_table = Table(matrix_rows, colWidths=[45 * mm, 30 * mm, 30 * mm, 30 * mm])
    matrix_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8e2bf")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c2b59b")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ]
        )
    )
    flow.extend([matrix_table, Spacer(1, 10), Paragraph("Feature Importance", heading)])

    feature_rows = [["Feature", "Importance"]]
    for item in feature_importance:
        feature_rows.append([item["feature"], f"{item['importance']:.4f}"])
    feature_table = Table(feature_rows, colWidths=[80 * mm, 35 * mm])
    feature_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dcebd8")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#a9bca0")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    flow.append(feature_table)

    doc.build(flow)
