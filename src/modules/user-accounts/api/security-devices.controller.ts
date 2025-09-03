import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Request, Res, UseGuards } from "@nestjs/common";
import { SecurityDevicesService } from "../application/security-device.service";
import { RefreshTokenGuard } from "../guards/refresh/refresh-token.guard";
import { SecurityDevice } from "../domain/security-devices.entity";
import { SecurityDeviceViewDto } from "./view-dto/security-device.view-dto";


@Controller('security/devices')
export class SecurityDevicesController {
    
    constructor(
        private securitryDevicesService: SecurityDevicesService,
    ){}

    @Get('')
    @UseGuards(RefreshTokenGuard)
    async getAllDevices(
        @Request() req,
    ): Promise<SecurityDeviceViewDto[] | undefined> {
        const userId = req.user.userId
        const devices = await this.securitryDevicesService.getAllUserDevices(userId)
        const result = devices!.map(device => ({
            deviceId: device.deviceId,
            ip: device.ip,
            title: device.title,
            lastActiveDate: device.lastActiveDate
        }))
        return result
    }

    @Delete('')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async terminateAllOtherDivices(
        @Request() req
    ): Promise<void> {
        const userId = req.user.userId
        const deviceId = req.user.deviceId
        await this.securitryDevicesService.deleteAllOtherDevices(userId, deviceId)
    }

    @Delete(':deviceId')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async terminateSpecificDevice(
        @Request() req,
        @Param('deviceId') deviceId: string,
    ): Promise<void> {
        const userId = req.user.userId
        await this.securitryDevicesService.deleteDevice(userId, deviceId)
    }
}