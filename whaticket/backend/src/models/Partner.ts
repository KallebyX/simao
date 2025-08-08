import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement
} from "sequelize-typescript";

@Table({
  tableName: "Partners"
})
class Partner extends Model<Partner> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  name: string;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  document: string;

  @Column
  commission: number;

  @Column
  typeCommission: string;

  @Column
  walletId: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

export default Partner;
