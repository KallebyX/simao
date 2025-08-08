import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import Company from "./Company";

@Table
class Announcement extends Model<Announcement> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  priority: number; //1 - alta, 2 - média, 3 - baixa

  @Column
  title: string;

  @Column(DataType.TEXT)
  text: string;

  @Column
  get mediaPath(): string | null {
    if (this.getDataValue("mediaPath")) {
      
      return `${process.env.BACKEND_URL}${process.env.PROXY_PORT ?`:${process.env.PROXY_PORT}`:""}/public/announcements/${this.getDataValue("mediaPath")}`;

    }
    return null;
  }

  @Column
  mediaName: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Column
  status: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;
}

export default Announcement;
