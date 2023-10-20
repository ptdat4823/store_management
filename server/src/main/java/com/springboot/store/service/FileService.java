package com.springboot.store.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.util.IOUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;

@Service
@Slf4j
public class FileService {
    @Autowired
    private AmazonS3 s3;
    @Value("${aws.s3.bucket}")
    private String bucketName;

    public String uploadFile(MultipartFile file ){
        File fileObj = convertMultiPartToFile(file);
        String fileName = System.currentTimeMillis()+"_"+file.getOriginalFilename();
        s3.putObject(new PutObjectRequest(bucketName,fileName,fileObj));
        fileObj.delete();
        String fileUrl="https://"+bucketName+".s3.amazonaws.com/"+fileName;
        return "File uploaded : "+fileName;
    }
    public byte[] downloadFile(String fileName){
        S3Object s3Object = s3.getObject(bucketName,fileName);
        S3ObjectInputStream inputStream = s3Object.getObjectContent();
        try{
            byte[] content = IOUtils.toByteArray(inputStream);
            return content;
        }catch (IOException e){
            e.printStackTrace();
        }
        return null;
    }

    public String deleteFile(String fileName){
        s3.deleteObject(bucketName,fileName);
        return fileName+" removed ...";
    }

    private File convertMultiPartToFile(MultipartFile file){
        File convertedFile = new File(file.getOriginalFilename());
        try{
            FileOutputStream fos = new FileOutputStream(convertedFile);
            fos.write(file.getBytes());
            fos.close();
        }catch (IOException e){
            log.error("Error converting multipartFile to file",e);
        }
        return convertedFile;
    }
}
