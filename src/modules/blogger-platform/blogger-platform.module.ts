import { Module } from "@nestjs/common";
import { BlogsModule } from "./blogs/blogs.module";

@Module({
    imports: [
        BlogsModule
    ],
    controllers: [],
    providers: [
        
    ],
    exports: [],
})

export class BloggersPlatformModule {}