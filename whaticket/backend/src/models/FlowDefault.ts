import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

@Table({
  tableName: "FlowDefaults"
})
export class FlowDefaultModel extends Model<FlowDefaultModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  companyId: number;

  @Column
  userId: number;

  @Column
  flowIdWelcome: number;

  @Column
  flowIdNotPhrase: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
