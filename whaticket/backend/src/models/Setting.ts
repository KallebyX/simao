import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement
} from "sequelize-typescript";

import Company from "./Company";

@Table
class Setting extends Model<Setting> {
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

export default Setting;
