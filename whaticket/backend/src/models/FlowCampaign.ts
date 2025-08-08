import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Whatsapp from "./Whatsapp";

@Table({
  tableName: "FlowCampaigns"
})
export class FlowCampaignModel extends Model<FlowCampaignModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  companyId: number;

  @Column
  userId: number;

  @Column
  name: string;

  @Column
  flowId: number;

  @Column
  phrase: string;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp

  @Column
  status: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
