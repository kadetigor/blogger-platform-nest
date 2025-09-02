import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Request, Res, UseGuards } from "@nestjs/common";
import { SecurityDevicesService } from "../application/security-device.service";
import { RefreshTokenGuard } from "../guards/refresh/refresh-token.guard";
import { SecurityDevice } from "../domain/security-devices.entity";


@Controller('security/devices')
export class SecurityDevicesController {
    
    constructor(
        private securitryDevicesService: SecurityDevicesService,
    ){}

    @Get('')
    @UseGuards(RefreshTokenGuard)
    async getAllDevices(
        @Request() req,
    ): Promise<SecurityDevice[] | undefined> {
        const userId = req.user.userId
        const result = await this.securitryDevicesService.getAllUserDevices(userId)
        return result
    }

    @Delete('')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    async terminateAllOtherDivices(
        @Request() req
    ): Promise<void> {
        const userId = req.user.userId
        const deviceId = req.user.deviceId
        await this.securitryDevicesService.deleteAllOtherDevices(userId, deviceId)
    }

    @Delete(':deviceId')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    async terminateSpecificDevice(
        @Request() req,
        @Param('deviceId') deviceId: string,
    ): Promise<void> {
        const userId = req.user.userId
        await this.securitryDevicesService.deleteDevice(userId, deviceId)
    }
}