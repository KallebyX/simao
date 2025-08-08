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
  tableName: "FlowAudios"
})
export class FlowAudioModel extends Model<FlowAudioModel> {
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

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
