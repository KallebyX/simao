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
  tableName: "Helps"
})
class Help extends Model<Help> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  title: string;

  @Column
  description: string;

  @Column
  video: string;

  @Column
  link: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

export default Help;
