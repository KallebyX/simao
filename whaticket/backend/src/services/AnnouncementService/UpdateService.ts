import AppError from "../../errors/AppError";
import Announcement from "../../models/Announcement";

interface Data {
  id: number | string;
  priority: string;
  title: string;
  text: string;
  status: string;
  companyId: number;
}

const UpdateService = async (data: Data): Promise<Announcement> => {
  const { id } = data;

  const record = await Announcement.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_ANNOUNCEMENT_FOUND", 404);
  }

  await record.update({
    ...data,
    id: Number(data.id),
    priority: Number(data.priority),
    status: data.status === 'true' || data.status === '1' || data.status === 'ativo'
  });

  return record;
};

export default UpdateService;
