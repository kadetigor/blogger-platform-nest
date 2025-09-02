import { Injectable } from "@nestjs/common";
import { SecurityDevicesRepository } from "../infrastructure/security-devices.repository";
import { SecurityDevice, SecurityDeviceDocument, SecurityDeviceModelType } from "../domain/security-devices.entity";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class SecurityDevicesService {

    constructor(
        private securityDevicesRepository: SecurityDevicesRepository,
        @InjectModel(SecurityDevice.name) private SecurityDeviceModel: Model<SecurityDeviceDocument>,
        private configService: ConfigService,
    ) {}

    async createDeviceWithId(userId: string, deviceId: string, ip: string, header: string): Promise<void> {
        const userAgent = await this.parseUserAgent(header)
        const refreshTime = this.configService.get('REFRESH_TIME') as number
        
        // Create the device object with all necessary fields
        const device = new this.SecurityDeviceModel({
            deviceId: deviceId,
            userId: userId,
            ip: ip,
            title: userAgent,
            lastActiveDate: new Date(), // Add this if needed
            expirationDate: new Date(Date.now() + refreshTime * 1000) // If refresh time is in seconds
        })

        await this.securityDevicesRepository.create(device)
    }

  async parseUserAgent(userAgent: string | undefined): Promise<string> {
    // Return default if no user agent
    if (!userAgent) {
        return "Unknown Device";
    }

    // Common browser patterns with their regex
    const browsers = [
        { name: "Edge", regex: /Edg\/(\d+)/ },
        { name: "Chrome", regex: /Chrome\/(\d+)/ },
        { name: "Firefox", regex: /Firefox\/(\d+)/ },
        { name: "Safari", regex: /Version\/(\d+).*Safari/ },
        { name: "Opera", regex: /OPR\/(\d+)|Opera\/(\d+)/ },
    ];

    // Check for mobile
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deviceType = isMobile ? "Mobile " : "";

    // Try to match each browser pattern
    for (const browser of browsers) {
        const match = userAgent.match(browser.regex);
        if (match) {
            // match[1] contains the version number captured by (\d+)
            const version = match[1] || match[2]; // Opera might use match[2]
            return `${deviceType}${browser.name} ${version}`;
        }
    }

    // If no browser matched, check for some common cases
    if (userAgent.includes("Postman")) {
        return "Postman";
    }

    if (userAgent.includes("curl")) {
        return "curl";
    }

    // Default fallback
    return deviceType ? "Mobile Browser" : "Unknown Browser";
  }

  async checkDevice(userId: string, deviceId: string): Promise<boolean> {
    const deviceByDeviceId = await this.securityDevicesRepository.findByDeviceId(deviceId)
    const deviceByUserId = await this.securityDevicesRepository.findByDeviceId(userId)

    if (deviceByDeviceId === deviceByUserId) {
        return true
    }

    return false
  }

  async getAllUserDevices(userId: string): Promise<SecurityDevice[] | undefined> {
    try {
        return await this.securityDevicesRepository.findDevicesByUserId(userId)
    } catch (e:unknown){
        console.log("Get all users' devices faild:", e);
    }
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void | boolean> {
    const deviceOwnership = await this.validateDeviceOwnership(userId, deviceId)

    if (!deviceOwnership) {
        return false
    }
    try {
        await this.securityDevicesRepository.deleteByDeviceId(deviceId)
        return
    } catch (e: unknown) {
        console.log('Device delition faild:', e);
    }
  }

  async deleteAllOtherDevices(userId: string, currentDeviceId: string): Promise<void> {
    try {
        await this.securityDevicesRepository.deleteAllExceptOne(userId, currentDeviceId)
        return
    } catch (e: unknown) {
        console.log('Device delition faild:', e);
    }
  }

  async updateDeviceActivity(deviceId: string): Promise<boolean | undefined> {
    try {
        return await this.securityDevicesRepository.updateLastActiveDate(deviceId, new Date())
    } catch (e: unknown) {
        console.log('Device delition faild:', e);
    }
  }

  async validateDeviceOwnership(userId: string, deviceId: string): Promise<boolean> {
    const device = await this.securityDevicesRepository.findByDeviceId(deviceId);
    if (!device) {
        return false; // Device not found
    }
    if (device.userId !== userId) {
        return false;
    }
    return true;
 }
}