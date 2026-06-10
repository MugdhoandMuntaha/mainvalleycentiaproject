import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    tableName: string;
    recordId: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    oldData: Record<string, unknown> | null;
    newData: Record<string, unknown> | null;
    performedBy: mongoose.Types.ObjectId | null;
    performedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    tableName: { type: String, required: true },
    recordId: { type: String, required: true },
    action: { type: String, enum: ['INSERT', 'UPDATE', 'DELETE'], required: true },
    oldData: { type: Schema.Types.Mixed, default: null },
    newData: { type: Schema.Types.Mixed, default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    performedAt: { type: Date, default: Date.now },
}, { timestamps: false });

AuditLogSchema.index({ tableName: 1 });
AuditLogSchema.index({ recordId: 1 });
AuditLogSchema.index({ performedAt: -1 });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
