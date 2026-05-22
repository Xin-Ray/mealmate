# weight-entry（体重录入 modal）

- **作用**：Stage 2+ 拍秤 + OCR + 手填校正 → addWeightRecord + HP +0.5
- **代码**：`app/app/(modal)/weight-entry.tsx`；服务 `app/src/services/weightOcr.ts`（Gemini 2.5 Flash Vision）
- **store 字段**：写 `addWeightRecord({kg, photoUri?})`；读 `settings.skipWeightPhoto`
- **不负责**：体重趋势可视化（→ stats）、Stage 1 体重（home 不渲染入口）、云同步（v1.1+）

详 [02-business-flows/weight-entry.md](../02-business-flows/weight-entry.md)。
