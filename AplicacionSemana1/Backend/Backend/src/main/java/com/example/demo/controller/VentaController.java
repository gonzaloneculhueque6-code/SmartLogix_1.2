package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/venta")
@CrossOrigin("*")
public class VentaController {
    
    // Agregamos la herramienta de Spring para enviar mensajes a Kafka
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @PostMapping("/{id}/{cantidad}")
    public String ventaProducto(@PathVariable Long id, @PathVariable int cantidad) {
        // Creamos el mensaje que se podra ver en el servidor de ServicioKafka (ejemplo: "1:1")
        String mensaje = id + ":" + cantidad;
        // Enviamos mensaje
        kafkaTemplate.send("ventas", mensaje); 
        
        return "Compra Realizada";
    }
}