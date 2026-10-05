package com.twelveaxes.service;

import java.util.Objects;
import java.util.function.Supplier;

/**
 * Guarda o ultimo valor calculado por thread, para a mesma chave.
 *
 * Uma requisicao de resultado pede o mesmo ranking varias vezes (topo, opostos,
 * melhor por categoria...). Como cada requisicao roda numa unica thread e os
 * catalogos sao imutaveis depois de carregados, basta lembrar o ultimo calculo:
 * a mesma entrada sempre gera a mesma saida, e uma chave nova substitui a antiga.
 */
final class RequestMemo<K, V> {
    private record Entry<K, V>(K key, V value) {
    }

    private final ThreadLocal<Entry<K, V>> last = new ThreadLocal<>();

    V get(K key, Supplier<V> compute) {
        Entry<K, V> entry = last.get();
        if (entry != null && Objects.equals(entry.key(), key)) {
            return entry.value();
        }
        V value = compute.get();
        last.set(new Entry<>(key, value));
        return value;
    }
}
