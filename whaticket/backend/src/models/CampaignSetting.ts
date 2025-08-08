import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "CampaignSettings" })
class CampaignSetting extends Model<CampaignSetting> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  key: string;

  @Column
  value: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}

export default CampaignSetting;
