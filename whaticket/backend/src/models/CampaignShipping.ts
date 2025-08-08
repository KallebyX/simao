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
import Campaign from "./Campaign";
import ContactListItem from "./ContactListItem";

@Table({ tableName: "CampaignShipping" })
class CampaignShipping extends Model<CampaignShipping> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  jobId: string;

  @Column
  number: string;

  @Column
  message: string;

  @Column
  confirmationMessage: string;

  @Column
  confirmation: boolean;

  @ForeignKey(() => ContactListItem)
  @Column
  contactId: number;

  @ForeignKey(() => Campaign)
  @Column
  campaignId: number;

  @Column
  confirmationRequestedAt: Date;

  @Column
  confirmedAt: Date;

  @Column
  deliveredAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => ContactListItem)
  contact: ContactListItem;

  @BelongsTo(() => Campaign)
  campaign: Campaign;
}

export default CampaignShipping;
