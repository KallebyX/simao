import AppError from "../errors/AppError";
import Integrations from "../models/Integrations";

const CheckIntegrations = async (key: string, companyId: number): Promise<Integrations> => {
    const integrations = await Integrations.findOne({
        where: { name: key, companyId: companyId }
    });

    if (!integrations) {
        throw new AppError("ERR_NO_INTEGRATIONS_FOUND", 404);
    }

    return integrations;
};

export default CheckIntegrations;