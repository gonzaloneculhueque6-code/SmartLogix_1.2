package com.example.demo.controller;

import org.apache.kafka.common.protocol.types.Field.Str;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.example.demo.repository.ProductoRepository;

@Service
public class ConsumerController {

    @Autowired
    private ProductoRepository productoRepository;

    @KafkaListener(topics = "ventas", groupId = "inventory-group",concurrency="3")
    public void desconsumirProducto(String mensaje) {
        // Lógica para descontar el stock del producto
        String[] partes = mensaje.split(":");
        Long productoId = Long.parseLong(partes[0]);
        int cantidad = Integer.parseInt(partes[1]);
        productoRepository.findById(productoId).ifPresent(producto -> {
            if (producto.getStock() >= cantidad) {
                producto.setStock(producto.getStock() - cantidad);
                productoRepository.save(producto);
                System.out.println("Stock actualizado para el producto ID: " + productoId);
            }else {
                // Manejar caso de stock insuficiente
                System.out.println("Stock insuficiente para el producto ID: " + productoId);
            }
        });

    }
}
